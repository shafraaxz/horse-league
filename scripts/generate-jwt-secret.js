// 10. scripts/generate-jwt-secret.js - JWT Secret Generator
// =====================================================

const crypto = require('crypto');

const generateSecureSecret = () => {
  const secret = crypto.randomBytes(64).toString('hex');
  const refreshSecret = crypto.randomBytes(64).toString('hex');
  
  console.log('🔐 Generated Secure JWT Secrets:');
  console.log('═'.repeat(50));
  console.log('\n📝 Add these to your .env.local file:\n');
  console.log(`JWT_SECRET=${secret}`);
  console.log(`JWT_REFRESH_SECRET=${refreshSecret}`);
  console.log('\n═'.repeat(50));
  console.log('\n⚠️  Security Tips:');
  console.log('• Never commit these secrets to git');
  console.log('• Use different secrets for production');
  console.log('• Rotate secrets periodically');
  console.log('• Store securely in environment variables');
};

if (require.main === module) {
  generateSecureSecret();
}

module.exports = generateSecureSecret;
