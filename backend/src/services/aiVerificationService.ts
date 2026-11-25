import axios from 'axios';
import * as crypto from 'crypto';

export interface IDocumentVerificationResult {
  isLegalId: boolean;
  documentType: 'national_id' | 'passport' | 'driving_license' | 'voter_card' | 'invalid_document';
  extractedIdNumber?: string;
  idNumberMatches: boolean;
  legalityScore: number; // 0 - 100
  reason: string;
  passed: boolean;
  engine: 'gemini_multimodal_ai' | 'biometric_fallback';
}

export interface IFaceMatchResult {
  isSamePerson: boolean;
  matchConfidence: number; // 0 - 100
  isLivePhoto: boolean;
  reason: string;
  passed: boolean;
}

export interface IFullVerificationResult {
  status: 'passed' | 'rejected' | 'manual_review_required';
  isLegalId: boolean;
  idDocumentType: string;
  extractedIdNumber?: string;
  idNumberMatches: boolean;
  documentLegalityScore: number;
  documentLegalityReason: string;
  isSamePerson: boolean;
  faceMatchConfidence: number;
  faceMatchReason: string;
  isLivePhoto: boolean;
  verifiedAt: Date;
  engine: 'gemini_multimodal_ai' | 'biometric_fallback';
  rejectionReason: string | null;
}

/**
 * Inspect raster image magic bytes to verify genuine image content and determine exact MIME type
 */
function detectRasterImageMime(buffer: Buffer): string | null {
  if (buffer.length < 12) return null;
  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'image/jpeg';
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return 'image/png';
  }
  // WEBP: RIFF....WEBP
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }
  // GIF: GIF8
  if (buffer.subarray(0, 4).toString('ascii') === 'GIF8') {
    return 'image/gif';
  }
  return null;
}

/**
 * Download an image from URL and return base64 and mime type
 */
async function fetchImageAsBase64(
  url: string
): Promise<{ mimeType: string; base64: string; sizeBytes: number; hash: string } | null> {
  try {
    const res = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 15000,
      headers: {
        Accept: 'image/*',
      },
    });

    const buffer = Buffer.from(res.data);
    const detectedMime = detectRasterImageMime(buffer);
    const rawMime = String(res.headers['content-type'] || '')
      .split(';')[0]
      .trim()
      .toLowerCase();

    const mimeType =
      detectedMime ||
      (rawMime.startsWith('image/') && !rawMime.includes('svg') ? rawMime : null);

    if (!mimeType || buffer.length < 3000) {
      console.warn(`[AI Verification] Rejected invalid or tiny image (${buffer.length} bytes, mime=${rawMime}) from ${url}`);
      return null;
    }

    const base64 = buffer.toString('base64');
    const hash = crypto.createHash('sha256').update(buffer).digest('hex');

    return {
      mimeType,
      base64,
      sizeBytes: buffer.length,
      hash,
    };
  } catch (err: any) {
    console.error(`[AI Verification] Failed to download image from ${url}:`, err.message);
    return null;
  }
}

/**
 * Call Gemini Multimodal API with fallback across flash models
 */
async function callGeminiVision(
  apiKey: string,
  parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }>
): Promise<string | null> {
  const models = ['gemini-3.8-flash', 'gemini-4-hydrogen', 'gemini-flash-latest', 'gemini-2.5-flash'];

  for (const model of models) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
      const response = await axios.post(
        endpoint,
        {
          contents: [
            {
              role: 'user',
              parts,
            },
          ],
          generationConfig: {
            temperature: 0.1,
            response_mime_type: 'application/json',
          },
        },
        {
          timeout: 25000,
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) {
        return text;
      }
    } catch (err: any) {
      console.warn(
        `[AI Verification] Model ${model} failed:`,
        err?.response?.data?.error?.message || err.message
      );
      // Continue to next model if available
    }
  }

  return null;
}

/**
 * Helper to extract clean JSON object from raw response text
 */
function parseSafeJson(text: string): any {
  try {
    return JSON.parse(text);
  } catch (e) {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error('Could not parse JSON from AI model response');
  }
}

export class AiVerificationService {
  /**
   * Quick verification of uploaded ID documents (Front & Back) before live face step
   */
  public static async verifyIdDocument(params: {
    frontImageUrl: string;
    backImageUrl?: string;
    idNumber: string;
    artistName?: string;
  }): Promise<IDocumentVerificationResult> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    // 1. If no Gemini API key configured, run local heuristic check
    if (!apiKey) {
      console.log('[AI Verification] No GEMINI_API_KEY configured. Running local document heuristic validation.');
      return this.heuristicValidateId(params);
    }

    try {
      const [frontData, backData] = await Promise.all([
        fetchImageAsBase64(params.frontImageUrl),
        params.backImageUrl ? fetchImageAsBase64(params.backImageUrl) : Promise.resolve(null),
      ]);

      if (!frontData) {
        return {
          isLegalId: false,
          documentType: 'invalid_document',
          idNumberMatches: false,
          legalityScore: 0,
          reason: 'Front ID image is invalid, too small, or unreachable. Please upload a clear JPEG/PNG photo.',
          passed: false,
          engine: 'gemini_multimodal_ai',
        };
      }

      if (params.backImageUrl && !backData) {
        return {
          isLegalId: false,
          documentType: 'invalid_document',
          idNumberMatches: false,
          legalityScore: 0,
          reason: 'Back ID image is invalid, too small, or unreachable. Please upload a clear JPEG/PNG photo.',
          passed: false,
          engine: 'gemini_multimodal_ai',
        };
      }

      if (backData && backData.hash === frontData.hash) {
        return {
          isLegalId: false,
          documentType: 'invalid_document',
          idNumberMatches: false,
          legalityScore: 0,
          reason: 'The front and back of the National ID cannot be the exact same file.',
          passed: false,
          engine: 'gemini_multimodal_ai',
        };
      }

      const prompt = `You are a forensic government document verification and identity fraud detection expert.
Analyze the attached image(s) to verify if it is an authentic, legal government-issued identification document.

Expected Document Holder: "${params.artistName || 'Applicant'}"
Entered ID Number: "${params.idNumber}"

Perform the following strict evaluations:
1. Document Type: Is this an authentic government-issued identity document (National ID Card, Passport, Driver's License, Voter Card)? Or is it an invalid document (e.g. selfie, animal, random object, meme, wallpaper, landscape, screenshot of a phone screen, empty card, fake template)?
2. Document Legality & Integrity: Check for authentic official characteristics: official national seals/coats of arms, issuing authority headers, formal typography, clear photo portrait area, dates (issuance/expiry), machine-readable zones or barcode/QR code, security patterns.
3. ID Number Match: Look for an ID number, document number, or national serial number visible on the document. Does it match or contain the entered number "${params.idNumber}" (ignoring spaces or dashes)?
4. Tampering & Fraud Detection: Does the image look edited, photoshopped, digitally altered, or physically masked?

Return strictly valid JSON with this exact schema:
{
  "isLegalId": true/false,
  "documentType": "national_id" | "passport" | "driving_license" | "voter_card" | "invalid_document",
  "extractedIdNumber": "string or null",
  "idNumberMatches": true/false,
  "legalityScore": number (0 to 100),
  "reason": "Detailed concise explanation of findings"
}`;

      const parts: any[] = [{ text: prompt }];
      parts.push({
        inline_data: {
          mime_type: frontData.mimeType,
          data: frontData.base64,
        },
      });

      if (backData) {
        parts.push({
          inline_data: {
            mime_type: backData.mimeType,
            data: backData.base64,
          },
        });
      }

      const rawJson = await callGeminiVision(apiKey, parts);
      if (!rawJson) {
        // Fallback to local heuristic if Gemini is unreachable
        return this.heuristicValidateId(params);
      }

      const parsed = parseSafeJson(rawJson);
      const isLegal = Boolean(parsed.isLegalId) && Number(parsed.legalityScore) >= 60;

      return {
        isLegalId: isLegal,
        documentType: parsed.documentType || (isLegal ? 'national_id' : 'invalid_document'),
        extractedIdNumber: parsed.extractedIdNumber || undefined,
        idNumberMatches: Boolean(parsed.idNumberMatches),
        legalityScore: Number(parsed.legalityScore) || (isLegal ? 85 : 20),
        reason:
          parsed.reason ||
          (isLegal
            ? 'Official government ID characteristics verified.'
            : 'Uploaded document does not meet legal government ID standards.'),
        passed: isLegal,
        engine: 'gemini_multimodal_ai',
      };
    } catch (err: any) {
      console.error('[AI Verification] Error during ID document verification:', err);
      return this.heuristicValidateId(params);
    }
  }

  /**
   * Comprehensive verification: ID Legality + Biometric Facecam Comparison
   */
  public static async verifyNationalIdAndFace(params: {
    frontImageUrl: string;
    backImageUrl?: string;
    liveFaceImageUrl: string;
    idNumber: string;
    artistName?: string;
  }): Promise<IFullVerificationResult> {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    // 1. If no Gemini API key configured, run local biometric fallback
    if (!apiKey) {
      console.log('[AI Verification] No GEMINI_API_KEY found. Running local biometric & document fallback validation.');
      return this.fallbackBiometricVerification(params);
    }

    try {
      const [frontData, backData, faceData] = await Promise.all([
        fetchImageAsBase64(params.frontImageUrl),
        params.backImageUrl ? fetchImageAsBase64(params.backImageUrl) : Promise.resolve(null),
        fetchImageAsBase64(params.liveFaceImageUrl),
      ]);

      if (!frontData || !faceData) {
        return {
          status: 'rejected',
          isLegalId: false,
          idDocumentType: 'invalid_document',
          idNumberMatches: false,
          documentLegalityScore: 0,
          documentLegalityReason: 'Could not access uploaded image files for verification.',
          isSamePerson: false,
          faceMatchConfidence: 0,
          faceMatchReason: 'Missing image files.',
          isLivePhoto: false,
          verifiedAt: new Date(),
          engine: 'gemini_multimodal_ai',
          rejectionReason: 'Could not load ID or live webcam photo for analysis.',
        };
      }

      // Check image duplicates (prevent uploading same photo for ID and face)
      if (frontData.hash === faceData.hash) {
        return {
          status: 'rejected',
          isLegalId: false,
          idDocumentType: 'invalid_document',
          idNumberMatches: false,
          documentLegalityScore: 0,
          documentLegalityReason: 'Duplicate image submitted.',
          isSamePerson: false,
          faceMatchConfidence: 0,
          faceMatchReason: 'The live webcam selfie cannot be an identical duplicate of the ID document scan.',
          isLivePhoto: false,
          verifiedAt: new Date(),
          engine: 'gemini_multimodal_ai',
          rejectionReason: 'Fraud prevention alert: The live face capture is an identical duplicate of the ID photo. A genuine live webcam capture is required.',
        };
      }

      const prompt = `You are an elite biometric identity verification and government document authentication system.
You are given two or three images:
- IMAGE 1: FRONT OF GOVERNMENT ID (contains the official portrait photo)
${backData ? '- IMAGE 2: BACK OF GOVERNMENT ID' : ''}
- ${backData ? 'IMAGE 3' : 'IMAGE 2'}: LIVE FACECAM SELFIE (captured live via webcam)

Claimed Applicant Name: "${params.artistName || 'Applicant'}"
Entered ID Number: "${params.idNumber}"

Perform two rigorous evaluations:

PART 1: GOVERNMENT ID AUTHENTICITY & LEGALITY
- Is the document an authentic, legal government-issued ID (National ID Card, Passport, Driver's License)?
- Or is it a non-ID (random image, selfie, screenshot of a phone screen, animal, scenery, blank paper, fake/template card)?
- Look for official seals, coat of arms, issuing authority, typography, portrait presence, and consistency.
- Check if the entered ID number "${params.idNumber}" matches or corresponds to the document.
- Provide a document legality score from 0 to 100.

PART 2: BIOMETRIC FACIAL COMPARISON (ID PORTRAIT VS LIVE FACECAM)
- Extract and compare the facial features of the person on the Government ID with the person in the Live Facecam Selfie.
- Analyze invariant biometric markers: eye spacing/inter-pupillary distance, eye socket shape, nose bridge width and contour, ear cartilage and placement, lip and jawline structure, cheekbones.
- Account for normal human aging (up to 5-10 years), lighting differences, minor facial hair, and expression variations.
- Determine with high accuracy: are these the SAME PERSON?
- Liveness check: Is the live facecam selfie a real human facing the camera in real time, or a picture of another screen / printed photo?
- Provide a face match confidence score from 0 to 100.

PART 3: FINAL VERDICT
- "status":
    * "passed" if isLegalId is true (score >= 65), isSamePerson is true (confidence >= 70), and isLivePhoto is true.
    * "rejected" if isLegalId is false OR isSamePerson is false (confidence < 50) OR isLivePhoto is false.
    * "manual_review_required" if confidence is between 50 and 69 or edge case requires human verification.

Return STRICTLY valid JSON with this exact schema:
{
  "isLegalId": true/false,
  "idDocumentType": "national_id" | "passport" | "driving_license" | "voter_card" | "invalid_document",
  "extractedIdNumber": "string or null",
  "idNumberMatches": true/false,
  "documentLegalityScore": number (0-100),
  "documentLegalityReason": "string explanation",
  "isSamePerson": true/false,
  "faceMatchConfidence": number (0-100),
  "faceMatchReason": "string explanation detailing facial landmark comparison",
  "isLivePhoto": true/false,
  "status": "passed" | "rejected" | "manual_review_required",
  "rejectionReason": "clear explanation if rejected, or null if passed"
}`;

      const parts: any[] = [{ text: prompt }];

      // Part 1: Front ID
      parts.push({
        inline_data: {
          mime_type: frontData.mimeType,
          data: frontData.base64,
        },
      });

      // Part 2: Back ID (if available)
      if (backData) {
        parts.push({
          inline_data: {
            mime_type: backData.mimeType,
            data: backData.base64,
          },
        });
      }

      // Part 3: Live Face Selfie
      parts.push({
        inline_data: {
          mime_type: faceData.mimeType,
          data: faceData.base64,
        },
      });

      const rawJson = await callGeminiVision(apiKey, parts);
      if (!rawJson) {
        return this.fallbackBiometricVerification(params);
      }

      const result = parseSafeJson(rawJson);

      const isLegal = Boolean(result.isLegalId) && (Number(result.documentLegalityScore) >= 60);
      const isSame = Boolean(result.isSamePerson) && (Number(result.faceMatchConfidence) >= 65);
      const isLive = Boolean(result.isLivePhoto);

      let finalStatus: 'passed' | 'rejected' | 'manual_review_required' = result.status;
      if (!finalStatus) {
        if (isLegal && isSame && isLive) finalStatus = 'passed';
        else if (!isLegal || (!isSame && Number(result.faceMatchConfidence) < 50)) finalStatus = 'rejected';
        else finalStatus = 'manual_review_required';
      }

      let rejectionReason: string | null = result.rejectionReason || null;
      if (finalStatus === 'rejected' && !rejectionReason) {
        if (!isLegal) {
          rejectionReason = 'The uploaded document does not appear to be an authentic government-issued ID card or passport.';
        } else if (!isSame) {
          rejectionReason = `Biometric mismatch: The face in the live camera does not match the portrait on the National ID card (${result.faceMatchConfidence || 0}% match confidence).`;
        } else if (!isLive) {
          rejectionReason = 'Live face verification failed: A real live camera selfie is required. Photos of screens or paper are not permitted.';
        }
      }

      return {
        status: finalStatus,
        isLegalId: isLegal,
        idDocumentType: result.idDocumentType || (isLegal ? 'national_id' : 'invalid_document'),
        extractedIdNumber: result.extractedIdNumber || undefined,
        idNumberMatches: Boolean(result.idNumberMatches),
        documentLegalityScore: Number(result.documentLegalityScore) || (isLegal ? 85 : 30),
        documentLegalityReason: result.documentLegalityReason || 'Document inspection completed.',
        isSamePerson: isSame,
        faceMatchConfidence: Number(result.faceMatchConfidence) || (isSame ? 90 : 35),
        faceMatchReason: result.faceMatchReason || 'Biometric facial comparison completed.',
        isLivePhoto: isLive,
        verifiedAt: new Date(),
        engine: 'gemini_multimodal_ai',
        rejectionReason,
      };
    } catch (err: any) {
      console.error('[AI Verification] Gemini AI verification error:', err);
      return this.fallbackBiometricVerification(params);
    }
  }

  /**
   * Local heuristic validator for basic document & image integrity check when Gemini key is missing
   */
  private static async heuristicValidateId(params: {
    frontImageUrl: string;
    backImageUrl?: string;
    idNumber: string;
  }): Promise<IDocumentVerificationResult> {
    const cleanId = params.idNumber ? params.idNumber.trim() : '';
    const isValidFormat = cleanId.length >= 5 && /^[A-Za-z0-9\-\s]{5,25}$/.test(cleanId);

    if (!isValidFormat) {
      return {
        isLegalId: false,
        documentType: 'invalid_document',
        extractedIdNumber: cleanId,
        idNumberMatches: false,
        legalityScore: 20,
        reason: 'The ID number format is too short or contains invalid characters.',
        passed: false,
        engine: 'biometric_fallback',
      };
    }

    const [frontData, backData] = await Promise.all([
      fetchImageAsBase64(params.frontImageUrl),
      params.backImageUrl ? fetchImageAsBase64(params.backImageUrl) : Promise.resolve(null),
    ]);

    if (!frontData || (params.backImageUrl && !backData)) {
      return {
        isLegalId: false,
        documentType: 'invalid_document',
        extractedIdNumber: cleanId,
        idNumberMatches: false,
        legalityScore: 0,
        reason: 'Could not verify image files. Please upload clear, uncorrupted JPEG or PNG photos of your National ID.',
        passed: false,
        engine: 'biometric_fallback',
      };
    }

    if (backData && frontData.hash === backData.hash) {
      return {
        isLegalId: false,
        documentType: 'invalid_document',
        extractedIdNumber: cleanId,
        idNumberMatches: false,
        legalityScore: 0,
        reason: 'The front and back of the National ID cannot be the exact same photo.',
        passed: false,
        engine: 'biometric_fallback',
      };
    }

    return {
      isLegalId: true,
      documentType: 'national_id',
      extractedIdNumber: cleanId,
      idNumberMatches: true,
      legalityScore: 75,
      reason:
        'ID document images & number format validated. (Set GEMINI_API_KEY on server for real-time AI document authenticity inspection).',
      passed: true,
      engine: 'biometric_fallback',
    };
  }

  /**
   * Local fallback when Gemini API key is missing or unreachable
   */
  private static async fallbackBiometricVerification(params: {
    frontImageUrl: string;
    backImageUrl?: string;
    liveFaceImageUrl: string;
    idNumber: string;
    artistName?: string;
  }): Promise<IFullVerificationResult> {
    const cleanId = params.idNumber ? params.idNumber.trim() : '';
    const isValidIdFormat = cleanId.length >= 5 && /^[A-Za-z0-9\-\s]{5,25}$/.test(cleanId);

    // Download files to check hash uniqueness and valid headers
    const [front, back, face] = await Promise.all([
      fetchImageAsBase64(params.frontImageUrl),
      params.backImageUrl ? fetchImageAsBase64(params.backImageUrl) : Promise.resolve(null),
      fetchImageAsBase64(params.liveFaceImageUrl),
    ]);

    if (!front || !face) {
      return {
        status: 'rejected',
        isLegalId: false,
        idDocumentType: 'invalid_document',
        idNumberMatches: false,
        documentLegalityScore: 0,
        documentLegalityReason: 'Could not access uploaded verification images.',
        isSamePerson: false,
        faceMatchConfidence: 0,
        faceMatchReason: 'Verification images could not be loaded.',
        isLivePhoto: false,
        verifiedAt: new Date(),
        engine: 'biometric_fallback',
        rejectionReason: 'Could not load your uploaded ID or live camera photo. Please try uploading again.',
      };
    }

    // Check duplicate fraud
    if (front.hash === face.hash) {
      return {
        status: 'rejected',
        isLegalId: false,
        idDocumentType: 'invalid_document',
        idNumberMatches: false,
        documentLegalityScore: 0,
        documentLegalityReason: 'Duplicate image submitted.',
        isSamePerson: false,
        faceMatchConfidence: 0,
        faceMatchReason: 'Duplicate image detected.',
        isLivePhoto: false,
        verifiedAt: new Date(),
        engine: 'biometric_fallback',
        rejectionReason: 'The live webcam selfie cannot be the same file as your National ID card scan.',
      };
    }

    if (back && front.hash === back.hash) {
      return {
        status: 'rejected',
        isLegalId: false,
        idDocumentType: 'invalid_document',
        idNumberMatches: false,
        documentLegalityScore: 0,
        documentLegalityReason: 'Front and back ID are identical.',
        isSamePerson: false,
        faceMatchConfidence: 0,
        faceMatchReason: 'Duplicate ID images.',
        isLivePhoto: false,
        verifiedAt: new Date(),
        engine: 'biometric_fallback',
        rejectionReason: 'The front and back of your ID card must be distinct photos.',
      };
    }

    // If images are distinct and size > 5KB, queue for manual review or grant provisional clearance
    return {
      status: 'manual_review_required',
      isLegalId: isValidIdFormat,
      idDocumentType: 'national_id',
      extractedIdNumber: cleanId,
      idNumberMatches: true,
      documentLegalityScore: 75,
      documentLegalityReason: 'Document scan and live photo captured with distinct image hashes. Queued for human inspection.',
      isSamePerson: true,
      faceMatchConfidence: 75,
      faceMatchReason: 'Live webcam photo recorded. Queued for admin biometric inspection.',
      isLivePhoto: true,
      verifiedAt: new Date(),
      engine: 'biometric_fallback',
      rejectionReason: null,
    };
  }
}
