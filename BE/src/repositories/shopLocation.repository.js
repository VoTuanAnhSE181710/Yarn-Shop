import ShopLocation from "../models/shopLocation.js";

export default class ShopLocationRepository {
  async findPrimary() {
    return ShopLocation.findOne({ key: "primary" }).lean();
  }

  async upsertPrimary(data) {
    return ShopLocation.findOneAndUpdate(
      { key: "primary" },
      { $set: data, $setOnInsert: { key: "primary" } },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    ).lean();
  }
}
