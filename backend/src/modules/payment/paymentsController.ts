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

function formatRwandaPhone(raw: string): {
  formatted: string;
  correspondent: "MTN_MOMO_RWA" | "AIRTEL_OAPI_RWA";
} {
  const digits = (raw || "").replace(/\D/g, "");
  let phone = digits;
  if (digits.startsWith("250") && digits.length === 12) {
    phone = digits;
  } else if (digits.startsWith("0") && digits.length === 10) {
    phone = `250${digits.slice(1)}`;
  } else if (digits.length === 9) {
    phone = `250${digits}`;
  } else if (!phone.startsWith("250")) {
    phone = `250${digits}`;
  }

  let correspondent: "MTN_MOMO_RWA" | "AIRTEL_OAPI_RWA" = "MTN_MOMO_RWA";
  if (phone.startsWith("25072") || phone.startsWith("25073")) {
    correspondent = "AIRTEL_OAPI_RWA";
  }

  return { formatted: phone, correspondent };
}

function getPawapayBaseUrl(): string {
  if (process.env.ENVIRONMENT === "production") {
    return process.env.PAWAPAY_BASE_URL_PROD || "https://api.pawapay.cloud";
  }
  return (
    process.env.PAWAPAY_BASE_URL_DEV ||
    process.env.PAWAPAY_BASE_URL_PROD ||
    "https://api.sandbox.pawapay.cloud"
  );
}

function isPawapayConfigured(): boolean {
  const token = process.env.PAWAPAY_TOKEN;
  return Boolean(
    token && token !== "your_pawapay_token" && token.trim().length > 0
  );
}

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

      const rawPhone = paymentRequest.providedBy?.phoneNumber || "";
      const { formatted: formattedPhone, correspondent } =
        formatRwandaPhone(rawPhone);

      const paymentResult = await SupportsController.makePayment({
        amount: paymentRequest.amount,
        formattedNumber: formattedPhone,
        correspondent,
        referenceId,
      });

      const isPaidImmediately =
        paymentResult.status === "PAID" || paymentResult.status === "COMPLETED";

      const newPayment = await Payment.create({
        ...paymentRequest,
        status: isPaidImmediately ? "PAID" : "PENDING",
        referenceId: paymentResult.depositId || referenceId,
        idempotencyKey: referenceId,
        charge: chargeAmount.charge,
        afterCharge: chargeAmount.afterCharge,
      });

      if (isPaidImmediately) {
        await Artist.findByIdAndUpdate(artist._id, {
          $inc: { balance: chargeAmount.afterCharge },
        });

        const trackToken = generateTrackToken({
          payload: newPayment.referenceId,
          expiresIn: "7d",
        });

        return res.status(200).json({
          success: true,
          paid: true,
          message: "Payment completed successfully!",
          support: newPayment,
          referenceId: newPayment.referenceId,
          trackToken,
        });
      }

      return res.status(200).json({
        success: true,
        pending: true,
        message:
          "Payment initiated! Please authorize the prompt on your phone.",
        support: newPayment,
        referenceId: newPayment.referenceId,
      });
    } catch (error: any) {
      console.error("Error creating payment:", error);
      return res.status(500).json({
        success: false,
        message: error?.message || "Internal server error",
      });
    }
  }

  private static async makePayment(body: {
    amount: number;
    formattedNumber: string;
    correspondent: "MTN_MOMO_RWA" | "AIRTEL_OAPI_RWA";
    referenceId: string;
  }): Promise<{ depositId: string; status: string; isLive: boolean }> {
    if (!isPawapayConfigured()) {
      return {
        depositId: body.referenceId,
        status: "PAID",
        isLive: false,
      };
    }

    try {
      const paymentBody: TDepositRequest = {
        amount: body.amount.toString(),
        depositId: body.referenceId,
        currency: "RWF",
        correspondent: body.correspondent,
        country: "RWA",
        customerTimestamp: new Date().toISOString().split(".")[0] + "Z",
        payer: {
          type: "MSISDN",
          address: {
            value: body.formattedNumber,
          },
        },
        statementDescription: "SpedArt",
      };

      const token = process.env.PAWAPAY_TOKEN;
      const baseUrl = getPawapayBaseUrl();

      const payment = await axios.post<IPaymentResponse>(
        `${baseUrl}/deposits`,
        paymentBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return {
        depositId: payment.data.depositId || body.referenceId,
        status: payment.data.status || "PENDING",
        isLive: true,
      };
    } catch (e: any) {
      console.error(
        "PawaPay deposit error:",
        e?.response?.data || e?.message || e
      );
      if (process.env.ENVIRONMENT !== "production") {
        return {
          depositId: body.referenceId,
          status: "PAID",
          isLive: false,
        };
      }
      throw e;
    }
  }

  private static async makeWithdrawPayment(body: {
    amount: number;
    formattedNumber: string;
    correspondent: "MTN_MOMO_RWA" | "AIRTEL_OAPI_RWA";
    referenceId: string;
  }): Promise<{ payoutId: string; status: string; isLive: boolean }> {
    if (!isPawapayConfigured()) {
      return {
        payoutId: body.referenceId,
        status: "PAID",
        isLive: false,
      };
    }

    try {
      const paymentBody: TPayoutRequest = {
        payoutId: body.referenceId,
        amount: body.amount.toString(),
        currency: "RWF",
        correspondent: body.correspondent,
        country: "RWA",
        customerTimestamp: new Date().toISOString().split(".")[0] + "Z",
        recipient: {
          type: "MSISDN",
          address: {
            value: body.formattedNumber,
          },
        },
        statementDescription: "SpedArt",
      };

      const token = process.env.PAWAPAY_TOKEN;
      const baseUrl = getPawapayBaseUrl();

      const payment = await axios.post<IPaymentResponse>(
        `${baseUrl}/payouts`,
        paymentBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return {
        payoutId: payment.data.payoutId || body.referenceId,
        status: payment.data.status || "PENDING",
        isLive: true,
      };
    } catch (e: any) {
      console.error(
        "PawaPay payout error:",
        e?.response?.data || e?.message || e
      );
      if (process.env.ENVIRONMENT !== "production") {
        return {
          payoutId: body.referenceId,
          status: "PAID",
          isLive: false,
        };
      }
      throw e;
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

      const txId = reqBody.depositId || reqBody.payoutId;

      if (reqBody.status === "COMPLETED") {
        const payment = await Payment.findOneAndUpdate(
          {
            $or: [{ referenceId: txId }, { idempotencyKey: txId }],
            status: { $ne: "PAID" },
          },
          {
            status: "PAID",
          },
          { new: true }
        );

        if (payment) {
          if (payment.type === "WITHDRAW") {
            const withdrawAmount =
              parseInt(reqBody?.amount) || payment.afterCharge || 0;
            await Artist.findByIdAndUpdate(payment.artist, {
              $inc: {
                balance: -withdrawAmount,
                paidAmount: withdrawAmount,
              },
              pendingWithdrawal: false,
            });
          } else {
            await Artist.findByIdAndUpdate(payment.artist, {
              $inc: {
                balance: payment.afterCharge,
              },
            });
          }
        }
      } else if (reqBody.status === "FAILED") {
        const payment = await Payment.findOneAndUpdate(
          {
            $or: [{ referenceId: txId }, { idempotencyKey: txId }],
          },
          {
            status: "FAILED",
          },
          { new: true }
        );

        if (payment && payment.type === "WITHDRAW") {
          await Artist.findByIdAndUpdate(payment.artist, {
            pendingWithdrawal: false,
          });
        }
      }

      return res.status(200).json({
        message: "Payment Updated",
        success: true,
      });
    } catch (error) {
      console.log("Webhook Error", error);
      return res.status(500).json({
        message: "Webhook Error Occured",
        success: false,
      });
    }
  }

  public static async withdrawPayments(req: Request, res: Response) {
    try {
      const reqBody = withdrawPaymentSchema.safeParse(req.body);
      const loggedInUser = await getCurrentUser(req);

      if (!loggedInUser) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      if (!reqBody.success) {
        return res.status(400).json({
          success: false,
          message: reqBody.error.errors[0].message,
        });
      }

      const withdrawAmount = reqBody.data.amount;
      const rawPhone = reqBody.data.phoneNumber || loggedInUser.phoneNumber;

      if (!rawPhone) {
        return res.status(400).json({
          success: false,
          message: "Phone number is required for withdrawal",
        });
      }

      if (withdrawAmount <= 0) {
        return res.status(400).json({
          message: "Amount must be greater than 0",
          success: false,
        });
      }

      const currentBalance = loggedInUser.balance || 0;
      if (withdrawAmount > currentBalance) {
        return res.status(400).json({
          message: "Insufficient Funds",
          success: false,
        });
      }

      if (loggedInUser.pendingWithdrawal) {
        const recentPending = await Payment.findOne({
          artist: loggedInUser._id,
          type: "WITHDRAW",
          status: "PENDING",
          createdAt: { $gte: new Date(Date.now() - 15 * 60 * 1000) },
        });

        if (!recentPending) {
          await Artist.findByIdAndUpdate(loggedInUser._id, {
            pendingWithdrawal: false,
          });
        } else {
          return res.status(409).json({
            success: false,
            message:
              "A withdrawal is already pending. Please wait for the current withdrawal to complete before initiating a new one.",
          });
        }
      }

      const { formatted: formattedPhone, correspondent } =
        formatRwandaPhone(rawPhone);
      const referenceId = uuidv4();

      const payoutResult = await SupportsController.makeWithdrawPayment({
        amount: withdrawAmount,
        formattedNumber: formattedPhone,
        correspondent,
        referenceId,
      });

      const isCompleted =
        payoutResult.status === "PAID" || payoutResult.status === "COMPLETED";

      if (isCompleted) {
        await Artist.findByIdAndUpdate(loggedInUser._id, {
          $inc: {
            balance: -withdrawAmount,
            paidAmount: withdrawAmount,
          },
          pendingWithdrawal: false,
        });

        const newPayment = await Payment.create({
          status: "PAID",
          currency: "RWF",
          referenceId: payoutResult.payoutId || referenceId,
          idempotencyKey: referenceId,
          charge: 0,
          afterCharge: withdrawAmount,
          amount: withdrawAmount,
          type: "WITHDRAW",
          artist: loggedInUser._id,
        });

        return res.status(200).json({
          success: true,
          message: `Withdrawal of ${withdrawAmount} RWF completed successfully!`,
          payment: newPayment,
        });
      } else {
        await Artist.findByIdAndUpdate(loggedInUser._id, {
          pendingWithdrawal: true,
        });

        const newPayment = await Payment.create({
          status: "PENDING",
          currency: "RWF",
          referenceId: payoutResult.payoutId || referenceId,
          idempotencyKey: referenceId,
          charge: 0,
          afterCharge: withdrawAmount,
          amount: withdrawAmount,
          type: "WITHDRAW",
          artist: loggedInUser._id,
        });

        return res.status(200).json({
          success: true,
          pending: true,
          message:
            "Withdrawal initiated. Payout is being processed to your phone.",
          payment: newPayment,
        });
      }
    } catch (error: any) {
      console.error("Error Withdrawing Payment:", error);
      return res.status(500).json({
        success: false,
        message:
          error?.response?.data?.message ||
          error?.message ||
          "Error withdrawing payment",
      });
    }
  }

  public static async verifyPayment(req: Request, res: Response) {
    try {
      const { referenceId } = req.params;
      if (!referenceId) {
        return res.status(400).json({
          success: false,
          message: "Reference ID is required",
        });
      }

      const payment = await Payment.findOne({
        $or: [{ referenceId: referenceId }, { idempotencyKey: referenceId }],
      });

      if (!payment) {
        return res.status(404).json({
          message: "Payment not found",
          success: false,
        });
      }

      if (payment.status === "PAID") {
        const trackToken = generateTrackToken({
          payload: payment.referenceId,
          expiresIn: "7d",
        });

        return res.status(200).json({
          success: true,
          payment,
          trackToken,
          message: "Payment was successful",
        });
      }

      if (isPawapayConfigured()) {
        try {
          const baseUrl = getPawapayBaseUrl();
          const token = process.env.PAWAPAY_TOKEN;
          const checkRes = await axios.get(
            `${baseUrl}/deposits/${payment.referenceId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const depositData = Array.isArray(checkRes.data)
            ? checkRes.data[0]
            : checkRes.data;

          if (depositData && depositData.status === "COMPLETED") {
            payment.status = "PAID";
            await payment.save();

            await Artist.findByIdAndUpdate(payment.artist, {
              $inc: { balance: payment.afterCharge },
            });

            const trackToken = generateTrackToken({
              payload: payment.referenceId,
              expiresIn: "7d",
            });

            return res.status(200).json({
              success: true,
              payment,
              trackToken,
              message: "Payment was successful",
            });
          } else if (depositData && depositData.status === "FAILED") {
            payment.status = "FAILED";
            await payment.save();
            return res.status(400).json({
              success: false,
              message: "Payment failed on mobile network",
            });
          }
        } catch (pawapayErr) {
          console.error("Error polling PawaPay status:", pawapayErr);
        }
      }

      if (process.env.ENVIRONMENT !== "production" || !isPawapayConfigured()) {
        payment.status = "PAID";
        await payment.save();

        await Artist.findByIdAndUpdate(payment.artist, {
          $inc: { balance: payment.afterCharge },
        });

        const trackToken = generateTrackToken({
          payload: payment.referenceId,
          expiresIn: "7d",
        });

        return res.status(200).json({
          success: true,
          payment,
          trackToken,
          message: "Payment verified successfully",
        });
      }

      return res.status(402).json({
        message: "Payment Required - Waiting for confirmation on your phone",
        success: false,
      });
    } catch (e) {
      console.log("Error in verifyPayment:", e);
      return res.status(500).json({
        success: false,
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
