import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { getMissingBodyRequiredParams } from "../../../global/utils/get_missing_body_required_source_params";

import {
  GlobalException,
  GlobalExceptionType,
} from "../../../global/exceptions/global_exception";
import { decodeUserToken } from "../../../global/utils/decode_user_token";
import { firestoreCollectionsConfig } from "../../../global/firebase_config/firebase_config";

import { createUkassaPayment } from "../handlers/ukassa/create_ukassa_payment";

import { Payment } from "@a2seven/yoo-checkout";
import {
  DEFAULT_CURRENCY,
  UKASSA_PAYMENT_DESCRIPTION,
  UKASSA_SECRET_KEY,
  UKASSA_SHOP_ID,
} from "../constants/constants";
import { getUsersRecordByUid } from "../../../global/utils/get_users_record_by_uid";
import { getRefFromPath } from "../../../global/utils/get_reference_from_path";
import { getOrdersRecordByRef } from "../../../global/utils/get_orders_record_by_ref";
import { OrderStatus } from "../../../global/enums/order_status";
import {
  PaymentsException,
  PaymentsExceptionType,
} from "../exceptions/payments_exception";

/**
 * required params:
 *  orderRefPath: string,
 */
export const initialPayment = onRequest(
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

      const orderRef = getRefFromPath(orderRefPath);

      const ordersRecord = await getOrdersRecordByRef(orderRef);

      if (ordersRecord === null) {
        throw new GlobalException(
          `Order with ref ${orderRefPath} is not found.`,
          GlobalExceptionType.DocumentNotFound,
          404
        );
      }

      const payment: Payment | null = await createUkassaPayment(
        process.env.UKASSA_SHOP_ID!,
        process.env.UKASSA_SECRET_KEY!,
        ordersRecord.price.toString(), // RUB currency format,
        DEFAULT_CURRENCY,
        usersRecord.ref,
        ordersRecord.description ?? UKASSA_PAYMENT_DESCRIPTION
      );

      // update payment in order

      if (payment === null) {
        ordersRecord.ref.update({ status: OrderStatus.Error });

        throw new PaymentsException(
          "Payment was not created.",
          PaymentsExceptionType.PaymentProviderError,
          500
        );
      } else {
        // update order
        ordersRecord.ref.update({
          status: OrderStatus.Pending,
          payment_id: payment.id,
          confirmation_url: payment.confirmation.confirmation_url,
        });
      }

      const updatedOrdersRecord = await getOrdersRecordByRef(ordersRecord.ref);

      if (updatedOrdersRecord === null) {
        throw new GlobalException(
          `Order with ref ${orderRefPath} is not found.`,
          GlobalExceptionType.DocumentNotFound,
          404
        );
      }

      //  send it
      response.status(200).send({
        message: "Payment was created and added to order.",
        order: updatedOrdersRecord,
        orderPath: updatedOrdersRecord.ref.path,
        url: payment.confirmation.confirmation_url,
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
          status: error.status,
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
