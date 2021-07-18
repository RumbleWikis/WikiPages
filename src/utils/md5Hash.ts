import * as crypto from "crypto";

function md5Hash(stringToHash: string): string {
  return crypto.createHash("md5").update(stringToHash).digest("hex").toString()
}

export default md5Hash;