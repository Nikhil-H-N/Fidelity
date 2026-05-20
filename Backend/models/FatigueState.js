const mongoose = require("mongoose");

const fatigueStateSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    shownCount: { type: Number, default: 0 },
    dismissedCount: { type: Number, default: 0 },
    clickedCount: { type: Number, default: 0 },
    consecutiveDismissals: { type: Number, default: 0 },
    lastShownAt: { type: Date, default: null },
    lastDismissedAt: { type: Date, default: null },
    fatigueScore: { type: Number, default: 0 },
    suppressedUntil: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FatigueState", fatigueStateSchema);
