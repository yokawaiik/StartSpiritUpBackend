export enum GlobalExceptionType {
  AccountNotFound = "Account not found in database.",
  RequiredParamsMissed = "Required parameters were missed.",
  TokenExpired = "Token expired.",
  TokenRevoked = "Token revoked.",
  UnexpectedTokenError = "Unexpected token error.",
  TokenNotValid = "Token is not valid.",
  NotAuthorized = "Not authorized.",
  Unexpected = "Unexepected iternal error.",
  RequiredParentRights = "Required parent rights.",
  BrokenAccount = "Broken child account.",
  AccountDisabled = "Account is disabled.",
  CantGetTasks = "Can't get tasks.",
  CantGetTasksCount = "Can't get tasks count.",
  CantUpdateTasks = "Can't update tasks.",
  CantHandleUser = "Cant handle user.",
  CantGetUsers = "Cant get users.",
  CantGetUsersCount = "Cant get users count.",
  UpdateDocumentError = "Update document error.",
  PaymentWasNotCreated = "Payment was not created.",
  CantGetDocument = "Cant get document.",
  DocumentNotFound = "Document not found.",
}

export class GlobalException extends Error {
  type: GlobalExceptionType;
  body: any;
  status: number;

  constructor(message: string, type: GlobalExceptionType, status?: number) {
    super(message);
    this.type = type;
    this.status = status ?? 400;
  }
}
