import { db } from "./db";
import { users } from "@shared/schema";

async function main() {
  console.log("Checking users table...");

  // Fetch all rows
  const allUsers = await db.select().from(users);
  console.log("All users:");
  console.table(allUsers);

  // Look for nulls in username, email, replitId
  const nulls = allUsers.filter(
    u => !u.username || !u.email || !u.replitId
  );
  if (nulls.length > 0) {
    console.log("⚠️ Found rows with NULLs in critical columns:");
    console.table(nulls);
  } else {
    console.log("✅ No nulls found in username, email, or replitId.");
  }

  // Look for duplicates in email and replitId
  const seenEmail = new Map<string, number>();
  const seenReplit = new Map<string, number>();

  for (const u of allUsers) {
    if (u.email) {
      seenEmail.set(u.email, (seenEmail.get(u.email) || 0) + 1);
    }
    if (u.replitId) {
      seenReplit.set(u.replitId, (seenReplit.get(u.replitId) || 0) + 1);
    }
  }

  const dupEmails = [...seenEmail.entries()].filter(([_, c]) => c > 1);
  const dupReplits = [...seenReplit.entries()].filter(([_, c]) => c > 1);

  if (dupEmails.length > 0) {
    console.log("⚠️ Duplicate emails found:", dupEmails);
  } else {
    console.log("✅ No duplicate emails found.");
  }

  if (dupReplits.length > 0) {
    console.log("⚠️ Duplicate replitIds found:", dupReplits);
  } else {
    console.log("✅ No duplicate replitIds found.");
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Error checking users:", err);
  process.exit(1);
});