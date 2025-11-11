import { NextRequest, NextResponse } from "next/server";

import {
  backendErrorResponse,
  createJsonError,
  forwardAuthRequest,
  readRequestJson
} from "../_utils";

type ForgotPasswordBody = {
  email: string;
};

type ForgotPasswordResponse = {
  data?: {
    token: string | null;
    expiresAt: string | null;
  };
  statusCode?: number;
  error?: string;
  message?: string;
};

export async function POST(request: NextRequest) {
  const body = await readRequestJson<ForgotPasswordBody>(request);

  if (!body) {
    return createJsonError(400, "INVALID_BODY", "Nevalidan payload.");
  }

  const { response, payload } = await forwardAuthRequest<ForgotPasswordResponse>("forgot-password", {
    method: "POST",
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    return backendErrorResponse(response, payload, "AUTH_FORGOT_FAILED", "Slanje instrukcija nije uspelo.");
  }

  return NextResponse.json(payload, { status: response.status });
}


