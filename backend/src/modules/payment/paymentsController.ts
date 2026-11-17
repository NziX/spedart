import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { axios } from "../../utils/axios.config";
import { generateTrackToken } from "../../utils/jwt";
import Art from "../art/artModel";
import Artist from "../artist/artistModel";
import Payment from "./paymentModel";
import { validatePayment, withdrawPaymentSchema } from "./paymentValidator";
import {
  IPaymentResponse,
  IWebHookResponse,
  TDepositRequest,
  TPayoutRequest,
} from "./types";
import calculateCharge from "../../utils/calculateCharge";
import { getCurrentUser } from "../../utils/currentUser";

export default class SupportsController {
  CREDIT_PERCENTAGE = 0.1;

  public static async createPayment(req: Request, res: Response) {
    try {
      const paymentRequest = validatePayment(req.body);
      const artist = await Artist.findById(paymentRequest.artist);
      const referenceId = uuidv4();
      const chargeAmount = calculateCharge(paymentRequest.amount);

      if (!artist) {
        return res.status(400).json({
          success: false,
          message: "Artist not found",
        });
      }

      // const token = await SupportsController.generatePaymentToken(res);
      //
      // if (!token) {
      //   throw new Error("Failed to generate payment token");
      // }
      //
      const payment = await SupportsController.makePayment(res, {
        amount: paymentRequest.amount,
        number: paymentRequest.providedBy?.phoneNumber as string,
        referenceId: referenceId,
      });

      const newPayment = await Payment.create({
        ...paymentRequest,
        status: "PENDING",
        referenceId: payment?.depositId,
        idempotencyKey: referenceId,
        charge: chargeAmount.charge,
        afterCharge: chargeAmount.afterCharge,
      });

      return res.status(200).json({
        success: false,
        message: "Payment Initiated!",
        support: newPayment,
      });

      // const trackToken = await generateTrackToken({
      // 	payload: newPayment.referenceId,
      // 	expiresIn: "120s",
      // });

      // return res.status(201).json({
      // success: true,
      // 	support: newPayment,
      // 	trackToken,
      // });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  // public static async generatePaymentToken(res: Response) {
  //   try {
  //     const token = await axios.post<{
  //       access: string;
  //       refresh: string;
  //       expires: string;
  //     }>(
  //       `${process.env.PAYPACK_BASE_URL}/auth/agents/authorize`,
  //       {
  //         client_id: process.env.PAYPACK_APPLICATION_ID,
  //         client_secret: process.env.PAYPACK_APPLICATION_SECRET,
  //       },
  //       {
  //         headers: {
  //           Accept: "application/json",
  //         },
  //       },
  //     );
  //
  //     return token.data.access;
  //   } catch (e) {
  //     console.error(e);
  //     res.status(500).json({
  //       message: "Failed to generate payment token",
  //       success: false,
  //     });
  //   }
  // }

  private static async makePayment(
    res: Response,
    body: { amount: number; number: string; referenceId: string },
  ) {
    try {
      const paymentBody: TDepositRequest = {
        amount: body.amount.toString(),
        depositId: body.referenceId,
        currency: "RWF",
        correspondent: "MTN_MOMO_RWA",
        country: "RWA",
        customerTimestamp: new Date().toISOString().split(".")[0] + "Z",
        payer: {
          type: "MSISDN",
          address: {
            value: `25${body.number}`,
          },
        },
        statementDescription: `SpedEd`,
      };

      const token = process.env.PAWAPAY_TOKEN;

      if (!token) {
        throw new Error("Payment Token is missing");
      }

      const payment = await axios.post<IPaymentResponse>(
        `${process.env.PAWAPAY_BASE_URL_PROD}/deposits`,
        paymentBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      return payment.data;
    } catch (e) {
      console.error(e);
      res.status(500).json({
        message: "Failed to make payment",
        success: false,
      });
    }
  }

  private static async makeWithdrawPayment(
    res: Response,
    body: { amount: number; number: string; referenceId: string },
  ) {
    try {
      const paymentBody: TPayoutRequest = {
        payoutId: body.referenceId,
        amount: body.amount.toString(),
        currency: "RWF",
        correspondent: "MTN_MOMO_RWA",
        country: "RWA",
        customerTimestamp: new Date().toISOString().split(".")[0] + "Z",
        recipient: {
          type: "MSISDN",
          address: {
            value: `25${body.number}`,
          },
        },
        statementDescription: `SpedEd`,
      };

      const token = process.env.PAWAPAY_TOKEN;

      if (!token) {
        throw new Error("Payment Token is missing");
      }

      const payment = await axios.post<IPaymentResponse>(
        `${process.env.PAWAPAY_BASE_URL_PROD}/payouts`,
        paymentBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      return payment.data;
    } catch (e) {
      console.error(e);
      res.status(500).json({
        message: "Failed to make payment",
        success: false,
      });
    }
  }

  public static async paymentWebhook(req: Request, res: Response) {
    try {
      const reqBody = req.body as IWebHookResponse;
      if (!reqBody) {
        return res.status(400).json({
          message: "No request body found",
          success: false,
        });
      }

      if (reqBody.status == "COMPLETED") {
        const payment = await Payment.findOneAndUpdate(
          {
            referenceId: reqBody.depositId || reqBody.payoutId,
          },
          {
            status: "PAID",
          },
        );

        if (payment?.type === "WITHDRAW") {
          await Artist.findByIdAndUpdate(payment?.artist, {
            $inc: {
              balance: -parseInt(reqBody?.amount),
            },
            pendingWithdrawal: false,
          });
        } else {
          await Artist.findOneAndUpdate(payment?.artist, {
            $inc: {
              balance: payment?.afterCharge,
            },
          });
        }
      }

      return res.status(200).json({
        message: "Payment Updated",
        success: true,
      });
    } catch (error) {
      console.log("Webhook Error", error);
      res.status(500).json({
        message: "Webhook Error Occured",
        success: false,
      });
    }
  }

  public static async withdrawPayments(req: Request, res: Response) {
    try {
      const reqBody = withdrawPaymentSchema.safeParse(req.body);
      const loggedInUser = await getCurrentUser(req);

      if (!reqBody.success) {
        return res.status(400).json({
          success: false,
          message: reqBody.error.errors[0].message,
        });
      }

      const withdrawAmount = reqBody.data.amount;
      const phoneNumber = reqBody.data.phoneNumber;

      if (withdrawAmount > loggedInUser?.balance!) {
        return res.status(400).json({
          message: "Insuficient Funds",
          success: false,
        });
      }

      if (Math.sign(withdrawAmount) === -1) {
        return res.status(400).json({
          message: "Amount can't be negative",
          success: false,
        });
      }

      // const token = await SupportsController.generatePaymentToken(res);
      //
      // if (!token) {
      //   return res.status(500).json({
      //     message: "Failed to generate payment token",
      //     success: false,
      //   });
      // }

      if (loggedInUser?.pendingWithdrawal) {
        return res.status(409).json({
          success: false,
          message:
            "A withdrawal is already pending. Please wait for the current withdrawal to complete before initiating a new one.",
        });
      } else {
        const updatedArtist = await Artist.findByIdAndUpdate(
          loggedInUser?._id,
          {
            pendingWithdrawal: true,
          },
        );
      }

      const referenceId = await uuidv4();
      const payment = await SupportsController.makeWithdrawPayment(res, {
        amount: withdrawAmount,
        number: phoneNumber,
        referenceId,
      });

      const newPayment = await Payment.create({
        status: "PENDING",
        currency: "RWF",
        referenceId: payment?.payoutId,
        idempotencyKey: referenceId,
        charge: 0,
        afterCharge: withdrawAmount,
        amount: withdrawAmount,
        type: "WITHDRAW",
        artist: loggedInUser?._id,
      });

      return res.status(200).json({
        success: true,
        message: "Payment Requested successfully",
      });
    } catch (error) {
      console.log("Error Withdrawing Payment", error);
      return res.status(500).json({
        success: false,
        message: "Error withdrawing payment",
      });
    }
  }

  public static async verifyPayment(req: Request, res: Response) {
    try {
      const { referenceId } = req.params;
      if (!referenceId) {
        return res.status(400).json({
          message: "Reference ID is required",
        });
      }

      const payment = await Payment.findOne({
        referenceId: referenceId,
      });

      if (!payment) {
        return res.status(404).json({
          message: "Payment not found",
          success: false,
        });
      }

      if (payment.status !== "PAID") {
        return res.status(402).json({
          message: "Payment Required",
          success: false,
        });
      }

      const trackToken = await generateTrackToken({
        payload: payment?.referenceId,
        expiresIn: "120s",
      });

      return res.status(200).json({
        success: true,
        payment,
        trackToken,
        message: "Payment was successful",
      });
    } catch (e) {
      console.log(e);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  public static async getTotalInterest(req: Request, res: Response) {
    try {
      const payments = await Payment.find({ status: "PAID" });
      const totalInterest = payments.reduce(
        (acc, curr) => acc + (curr?.charge || 0),
        0,
      );
      res.status(200).json({
        success: true,
        totalInterest: totalInterest,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: "Failed to get total interest",
      });
    }
  }

  public static async getPayments(req: Request, res: Response) {
    try {
      const supports = await Payment.find().populate("artist");
      const creditRemovedPayments = supports.map((payment) => {
        const paymentObj = payment.toObject();
        const newAmount = paymentObj?.afterCharge || 0;

        return {
          ...paymentObj,
          amount: Math.round(newAmount * 100) / 100, // Round to 2 decimal places
        };
      });

      res.status(200).json({
        success: true,
        supports: creditRemovedPayments,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  public static async getPaymentsByArtist(req: Request, res: Response) {
    try {
      const { artistId } = req.params;
      const artist = await Artist.findById(artistId);
      if (!artist) {
        return res.status(400).json({
          success: false,
          message: "Artist not found",
        });
      }
      const payments = await Payment.find({
        artist: artistId,
        status: "PAID",
      }).populate("art");

      const creditRemovedPayments = payments.map((payment) => {
        const paymentObj = payment.toObject();
        const newAmount = paymentObj.afterCharge || 0;

        return {
          ...paymentObj,
          amount: Math.round(newAmount * 100) / 100, // Round to 2 decimal places
        };
      });

      res.status(200).json({
        success: true,
        payments: creditRemovedPayments,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  public static async getPaymentsByArt(req: Request, res: Response) {
    try {
      const { artId } = req.params;
      const art = await Art.findById(artId);
      if (!art) {
        return res.status(400).json({
          success: false,
          message: "Art not found",
        });
      }
      const payments = await Payment.find({ art: artId });
      res.status(200).json({
        success: true,
        payments,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  public static async getTotalPaymentsByArtist(req: Request, res: Response) {
    try {
      const { artistId } = req.params;
      const artist = await Artist.findById(artistId);
      if (!artist) {
        return res.status(400).json({
          success: false,
          message: "Artist not found",
        });
      }
      const payments = await Payment.find({ artist: artistId, status: "PAID" });
      const totalPayments = payments.reduce(
        (acc, curr) => acc + (curr?.afterCharge || 0),
        0,
      );

      res.status(200).json({
        success: true,
        totalPayments: totalPayments,
        paidAmount: artist.paidAmount,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  public static async getCurrentMonthRevenueByArtist(
    req: Request,
    res: Response,
  ) {
    try {
      const { artistId } = req.params;
      const artist = await Artist.findById(artistId);
      if (!artist) {
        return res.status(400).json({
          success: false,
          message: "Artist not found",
        });
      }

      const currentDate = new Date();
      const firstDayOfCurrentMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1,
      );

      const firstDayOfPreviousMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        1,
      );

      const paymentsCurrentMonth = await Payment.find({
        artist: artistId,
        status: "PAID",
        createdAt: { $gte: firstDayOfCurrentMonth },
      });

      const paymentsPreviousMonth = await Payment.find({
        artist: artistId,
        createdAt: {
          $gte: firstDayOfPreviousMonth,
          $lt: firstDayOfCurrentMonth,
        },
        status: "PAID",
      });

      const totalRevenueCurrentMonth = paymentsCurrentMonth.reduce(
        (acc, payment) => acc + (payment?.afterCharge || 0),
        0,
      );

      const totalRevenuePreviousMonth = paymentsPreviousMonth.reduce(
        (acc, payment) => acc + (payment?.afterCharge || 0),
        0,
      );

      const percentageChange = totalRevenuePreviousMonth
        ? ((totalRevenueCurrentMonth - totalRevenuePreviousMonth) /
            totalRevenuePreviousMonth) *
          100
        : 0;

      res.status(200).json({
        success: true,
        totalRevenue: totalRevenueCurrentMonth,
        percentageChange: `${percentageChange.toFixed(1)}% from last month`,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: "Failed to get total revenue",
      });
    }
  }

  public static async getTotalIncomeAnalyticsByArtist(
    req: Request,
    res: Response,
  ) {
    try {
      const { artistId } = req.params;
      const { startDate, endDate } = req.query;

      const artist = await Artist.findById(artistId);
      if (!artist) {
        return res.status(400).json({
          success: false,
          message: "Artist not found",
        });
      }

      const dateFilter: any = {};
      if (startDate) dateFilter.$gte = new Date(startDate as string);
      if (endDate) dateFilter.$lte = new Date(endDate as string);

      const payments = await Payment.find({
        artist: artistId,
        createdAt: dateFilter,
        status: "PAID",
      });

      const aggregatedPayments = payments.reduce((acc: any, payment: any) => {
        const date = payment.createdAt.toISOString().split("T")[0];
        if (!acc[date]) {
          acc[date] = { date, support: 0, purchase: 0 };
        }
        if (payment.type === "SUPPORT") {
          acc[date].support += payment?.afterCharge || 0;
        } else if (payment.type === "PURCHASE") {
          acc[date].purchase += payment?.afterCharge || 0;
        }
        return acc;
      }, {});

      const result = Object.values(aggregatedPayments);

      return res.status(200).json({
        success: true,
        stats: result,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({
        success: false,
        message: "Failed to get total revenue",
      });
    }
  }

  public static async getArtistBalance(req: Request, res: Response) {
    try {
      const loggedInUser = await getCurrentUser(req);

      return res.status(200).json({
        balance: loggedInUser?.balance || 0,
        success: true,
      });
    } catch (error) {
      console.log("Error getting artist balance");
      res.status(500).json({
        message: "Error getting artist balance",
        success: false,
      });
    }
  }

  public static async getTotalPayments(req: Request, res: Response) {
    try {
      const payments = await Payment.find({
        status: "PAID",
      });
      const totalPayments = payments.reduce(
        (acc, curr) => acc + (curr.amount || 0),
        0,
      );
      res.status(200).json({
        success: true,
        totalPayments: totalPayments,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: "Failed to get total payments",
      });
    }
  }
}
