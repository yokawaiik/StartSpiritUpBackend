/* eslint-disable @typescript-eslint/no-unused-vars */
import { onDocumentUpdated } from "firebase-functions/v2/firestore";

import * as logger from "firebase-functions/logger";

import { EventsRecordMapper } from "../../../global/mappers/events_record_mapper";
import { EventStatus } from "../../../global/enums/event_status";
import { getOrdersRecordByRef } from "../../../global/utils/get_orders_record_by_ref";
import { OrderStatus } from "../../../global/enums/order_status";
import {
  adminFirestore,
  firestoreInstance,
} from "../../../global/firebase_config/firebase_config";

export const updateEventsTrigger = onDocumentUpdated(
  "events/{doc}",
  async (event) => {
    const beforeDoc = event.data?.before;
    const afterDoc = event.data?.after;

    if (!beforeDoc?.exists || !afterDoc?.exists) {
      return;
    }

    const beforeEventsRecord = EventsRecordMapper.fromDocument(beforeDoc);
    const afterEventsRecord = EventsRecordMapper.fromDocument(afterDoc);

    logger.info({
      message: "onDocumentUpdated for events called.",
      beforeEventsRecord: beforeEventsRecord,
      afterEventsRecord: afterEventsRecord,
    });

    // ? nothing changed
    if (
      afterEventsRecord.status === null ||
      afterEventsRecord.status === beforeEventsRecord.status
    ) {
      return;
    }

    // ? status changed
    if (
      beforeEventsRecord.status !== EventStatus.Completed &&
      afterEventsRecord.status === EventStatus.Completed
    ) {
      if (afterEventsRecord.order_ref === null) {
        logger.info({
          message: "afterEventsRecord.order_ref is null",
        });
        return;
      }

      const order = await getOrdersRecordByRef(afterEventsRecord.order_ref);

      if (order === null) {
        logger.info({
          message: "order is null",
        });
        return;
      }

      if (order.seller_ref === null) {
        logger.info({
          message: "order.seller_ref is null",
        });
        return;
      }

      const writeBatch = firestoreInstance.batch();

      // ? info : update seller balance
      writeBatch.update(order.seller_ref, {
        balance: adminFirestore.FieldValue.increment(order.amount),
      });

      // ? info : update order status
      writeBatch.update(order.ref, {
        status: OrderStatus.Completed,
      });

      await writeBatch.commit();

      logger.info({
        message: "Order status was updated.",
      });
    }
  }
);
