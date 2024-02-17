export const getMissingBodyRequiredParams = (
  body: any,
  requiredParams: Array<string>
): Array<string> => {
  const missingParams = requiredParams.filter((param) => {
    return !body[param];
  });

  return missingParams;
};
