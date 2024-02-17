import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { getMissingBodyRequiredParams } from "../../../global/utils/get_missing_body_required_source_params";

import {
  GlobalException,
  GlobalExceptionType,
} from "../../../global/exceptions/global_exception";
import { decodeUserToken } from "../../../global/utils/decode_user_token";
import { firestoreCollectionsConfig } from "../../../global/firebase_config/firebase_config";

import {
  DEFAULT_CURRENCY,
  UKASSA_PAYMENT_REFUND_DESCRIPTION,
  UKASSA_SECRET_KEY,
  UKASSA_SHOP_ID,
} from "../constants/constants";

import { getUsersRecordByUid } from "../../../global/utils/get_users_record_by_uid";
import { getOrdersRecordByRef } from "../../../global/utils/get_orders_record_by_ref";
import { getRefFromPath } from "../../../global/utils/get_reference_from_path";
import { OrderStatus } from "../../../global/enums/order_status";
import {
  PaymentsException,
  PaymentsExceptionType,
} from "../exceptions/payments_exception";
import { createUkassaRefund } from "../handlers/ukassa/create_ukassa_refund";

/**
 * required params:
 *  orderRefPath: string,
 */
export const refundPayment = onRequest(
  {
    maxInstances: 10,
    secrets: [UKASSA_SHOP_ID, UKASSA_SECRET_KEY],
  },
  async (request, response) => {
    try {
      // -- boiler plate verifiction
      const decodedUserToken = await decodeUserToken(request);

      if (decodedUserToken === null) {
        logger.info({
          message: GlobalExceptionType.NotAuthorized,
          request: request,
        });
        response.status(401).send({
          error: GlobalExceptionType.NotAuthorized,
        });
        return;
      }

      // -- boiler plate verifiction
      // -- check if request by parent
      const usersRecord = await getUsersRecordByUid(
        firestoreCollectionsConfig,
        decodedUserToken.uid
      );

      if (usersRecord === null) {
        throw new GlobalException(
          `User with uid ${decodedUserToken.uid} is not found.`,
          GlobalExceptionType.NotAuthorized,
          401
        );
      }

      logger.info({
        message: `Request to initial payment with Ukassa user with uid: ${decodedUserToken.uid}.`,
        decodedUserToken: decodedUserToken,
      });

      // -- check if request by parent

      const missedParams = getMissingBodyRequiredParams(request.body, [
        "orderRefPath",
      ]);

      if (missedParams.length > 0) {
        throw new GlobalException(
          `Required parameters were missed: ${missedParams.join(", ")}.`,
          GlobalExceptionType.RequiredParamsMissed,
          400
        );
      }

      const { orderRefPath } = request.body;

      // ? info : check if order exist
      const ordersRecord = await getOrdersRecordByRef(
        getRefFromPath(orderRefPath)
      );

      if (
        ordersRecord === null ||
        ordersRecord?.status === null ||
        ordersRecord?.payment_id === null
      ) {
        throw new GlobalException(
          `Order with ref ${orderRefPath} is not found or status is not paid.`,
          GlobalExceptionType.DocumentNotFound,
          404
        );
      }

      if (ordersRecord?.status === OrderStatus.Refunded) {
        logger.info({
          message: `Order with ref ${orderRefPath} is refunded.`,
          orderRefPath: orderRefPath,
        });
        throw new PaymentsException(
          `Order with ref ${orderRefPath} is refunded.`,
          PaymentsExceptionType.PaymentAlreadyRefunded,
          404
        );
      }

      const priceValue = ordersRecord?.price!.toString();

      logger.info({
        message: `Price value is ${priceValue}.`,
        priceValue: priceValue,
      });

      // const writeBatch = firestoreInstance.batch();

      // ? info: take money from client automatically
      const refund = await createUkassaRefund(
        process.env.UKASSA_SHOP_ID!,
        process.env.UKASSA_SECRET_KEY!,
        ordersRecord.payment_id,
        priceValue,
        DEFAULT_CURRENCY,
        ordersRecord.description ?? UKASSA_PAYMENT_REFUND_DESCRIPTION
      );

      // update payment in order

      if (refund === null) {
        ordersRecord.ref.update({ status: OrderStatus.RefundError });

        throw new PaymentsException(
          "Refund was not created.",
          PaymentsExceptionType.PaymentProviderError,
          500
        );
      } else {
        logger.info({
          message: "Payment waiting for refund.",
        });

        // ordersRecord.ref.update({ status: OrderStatus.Refunded });
      }

      logger.info({
        message: "Payment was refunded.",
      });

      response.status(200).send({
        message: "Payment was refunded.",
      });
    } catch (error) {
      if (error instanceof PaymentsException) {
        logger.warn({
          error: error.message,
          type: error.type,
          status: error.status,
          ...error.body,
        });
        response.status(error.status).send({
          error: error.message,
          ...error.body,
        });
        return;
      } else if (error instanceof GlobalException) {
        logger.warn({
          error: error.message,
          type: error.type,
        });
        response.status(error.status).send({
          error: error.message,
          type: error.type,
        });
        return;
      }

      logger.error({
        error: error,
        type: GlobalExceptionType.Unexpected,
      });

      response.status(500).send({
        error: error,
        type: GlobalExceptionType.Unexpected,
      });
    }
  }
);
