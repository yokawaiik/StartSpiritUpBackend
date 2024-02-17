import { firestoreInstance } from "../firebase_config/firebase_config";

export const getRefFromPath = (path: string) => {
  return firestoreInstance.doc(path);
};
