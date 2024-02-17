import { writeFile, writeFileSync } from "fs";

export const saveTokenIntoFile = async (data, filePath) => {
  const jsonData = data;
  writeFileSync(filePath, jsonData, (err) => {
    if (err) {
      console.error("Error writing file:", err);
    } else {
      console.log("String saved to JSON file successfully.");
    }
  });
};
