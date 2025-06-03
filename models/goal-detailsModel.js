const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    goal: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Goal",
      required: [true, "Transaction must be linked to a goal"],
    },
    description: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Transaction must have an amount"],
      validate: {
        validator: function (val) {
          return val > 0;
        },
        message: "Transaction amount must be greater than 0",
      },
    },

    type: {
      type: String,
      enum: ["deposit", "withdrawal"],
      required: [true, "Transaction type is required"],
    },
    date: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Transaction", transactionSchema);
