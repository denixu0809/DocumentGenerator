const mongoose = require('mongoose');
const crypto = require('crypto');

const generateApiKey = () => {
    return crypto.randomBytes(5).toString('hex').toUpperCase(); // Generates a 10-character key
};

const clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  api_key: {
    type: String,
    required: true,
    unique: true
  },
  total_credit: {
    type: Number,
    required: true,
    default: 0
  },
  used_credit: {
    type: Number,
    required: true,
    default: 0
  },
  remaining_credit: {
    type: Number,
    required: true,
    default: function() {
      return this.total_credit - this.used_credit;
    }
  }
}, { timestamps: true });

// Update remaining_credit automatically before saving
clientSchema.pre('validate',async function(next) {
  if (this.isNew) {
    let unique = false;
    while (!unique) {
      this.api_key = generateApiKey();
      const existingClient = await this.constructor.findOne({ api_key: this.api_key });
      if (!existingClient) {
        unique = true;
      }
    }
  }
  this.remaining_credit = this.total_credit - this.used_credit;
  next();
});

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;
