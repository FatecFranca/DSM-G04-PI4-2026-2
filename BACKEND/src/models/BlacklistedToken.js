const mongoose = require('mongoose');

const blacklistedTokenSchema = new mongoose.Schema(
  {
    token_hash: {
      type: String,
      required: true,
      unique: true,
      maxlength: 128
    },
    expires_at: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// TTL index: MongoDB remove automaticamente tokens expirados
blacklistedTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 });

const BlacklistedToken = mongoose.model('BlacklistedToken', blacklistedTokenSchema);

module.exports = BlacklistedToken;