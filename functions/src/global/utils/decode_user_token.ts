import { Request } from "firebase-functions/lib/v2/providers/https";
import { DecodedIdToken } from "firebase-admin/auth";
import {
  GlobalException,
  GlobalExceptionType,
} from "../exceptions/global_exception";
import { firebaseAuth } from "../firebase_config/firebase_config";

import * as logger from "firebase-functions/logger";

// ? info: Header: Authorization: Token [auth_token]

export const decodeUserToken = async (
  request: Request
): Promise<DecodedIdToken | null> => {
  try {
    const authorization = request.get("Authorization");

    logger.error({
      message: "start decode user token",
      header: request.headers,
      request: request,
    });

    const token = authorization;

    if (!token) {
      return null;
    }

    const decodedToken = await firebaseAuth.verifyIdToken(token);

    return decodedToken;
  } catch (error: any) {
    let message = "Unexpected error";
    let type = GlobalExceptionType.Unexpected;

    if (error?.code !== null) {
      switch (error.code as string) {
        case "auth/id-token-expired":
          message = "Token expired";
          type = GlobalExceptionType.TokenExpired;
          break;
        case "auth/id-token-revoked":
          message = "Token revoked";
          type = GlobalExceptionType.TokenRevoked;
          break;
        case "auth/user-disabled":
          message = "Token revoked";
          type = GlobalExceptionType.AccountDisabled;
          break;
        default:
          message = "Unexpected token error";
          type = GlobalExceptionType.UnexpectedTokenError;
          break;
      }
    }

    logger.error({
      message: message,
      type: type,
      error: error,
      request: request,
    });

    throw new GlobalException(message, type);
  }
};
