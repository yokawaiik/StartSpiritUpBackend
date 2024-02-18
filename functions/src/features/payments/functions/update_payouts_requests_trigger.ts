/* eslint-disable @typescript-eslint/no-unused-vars */
import { onDocumentUpdated } from "firebase-functions/v2/firestore";

import * as logger from "firebase-functions/logger";
import { PayoutRequestsRecordMapper } from "../../../global/mappers/payout_requests_record_mapper";
import { PayoutRequestStatus } from "../../../global/enums/payout_request_status";

export const updatePayoutsRequestsTrigger = onDocumentUpdated(
  "payout_requests/{doc}",
  async (event) => {
    const beforeDoc = event.data?.before;
    const afterDoc = event.data?.after;

    if (!beforeDoc?.exists || !afterDoc?.exists) {
      return;
    }

    logger.info({
      message: "onDocumentUpdated for payout_requests called.",
      beforeDoc: beforeDoc,
      afterDoc: afterDoc,
    });

    const beforePayoutRequestRecord =
      PayoutRequestsRecordMapper.fromDocument(beforeDoc);
    const afterPayoutRequestRecord =
      PayoutRequestsRecordMapper.fromDocument(afterDoc);

    if (afterPayoutRequestRecord.created_by === null) {
      return;
    }

    if (beforePayoutRequestRecord.status === afterPayoutRequestRecord.status) {
      return;
    }

    if (
      beforePayoutRequestRecord.status === PayoutRequestStatus.Pending &&
      afterPayoutRequestRecord.status === PayoutRequestStatus.Accepted
    ) {
      await afterPayoutRequestRecord.created_by!.update({
        balance: 0,
      });

      // todo: maybe send notification in user ith admin message
    }
  }
);
