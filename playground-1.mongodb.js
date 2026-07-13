use("RabbitCV");

// 1. Xoá 2 Job Test theo đúng _id
db.jobs.deleteOne({ _id: ObjectId("6a475789ecea2761394e34ec") });
db.jobs.deleteOne({ _id: ObjectId("6a475789ecea2761394e34ef") });

// 2. Xoá 2 Notification tương ứng theo đúng _id
db.notifications.deleteOne({ _id: ObjectId("6a4757d08db44acf5be12bb3") });
db.notifications.deleteOne({ _id: ObjectId("6a4757d08db44acf5be12baf") });
