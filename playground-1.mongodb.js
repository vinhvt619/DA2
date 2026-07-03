// MongoDB Playground
use('RabbitCV');

console.log("--- XÓA DỮ LIỆU RÁC ---");

const delApp = db.applications.deleteOne({ _id: ObjectId("6a47417ef07221edc1b2934d") });
console.log("Deleted Application count:", delApp.deletedCount);

const delNotif1 = db.notifications.deleteOne({ _id: ObjectId("6a47417ef07221edc1b29356") });
console.log("Deleted Notification 1 count:", delNotif1.deletedCount);

const delNotif2 = db.notifications.deleteOne({ _id: ObjectId("6a47417ef07221edc1b2934f") });
console.log("Deleted Notification 2 count:", delNotif2.deletedCount);

const delResume = db.resumes.deleteOne({ _id: ObjectId("6a47417ef07221edc1b2934b") });
console.log("Deleted Resume count:", delResume.deletedCount);

console.log("\n--- KIỂM TRA LẠI DỮ LIỆU ---");

const checkApp = db.applications.find({ 
  _id: ObjectId("6a47417ef07221edc1b2934d")
}).toArray();
console.log("Remaining garbage application count:", checkApp.length);

const checkNotifs = db.notifications.find({
  _id: { $in: [ObjectId("6a47417ef07221edc1b29356"), ObjectId("6a47417ef07221edc1b2934f")] }
}).toArray();
console.log("Remaining garbage notifications count:", checkNotifs.length);

const checkResume = db.resumes.find({
  _id: ObjectId("6a47417ef07221edc1b2934b")
}).toArray();
console.log("Remaining garbage resume count:", checkResume.length);
