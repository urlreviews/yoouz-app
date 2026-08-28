const fs = require('fs');
let code = fs.readFileSync('src/components/CopoCreateModal.tsx', 'utf8');

const targetConstraint = `      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: "user",
          width: { ideal: 1080 },
          height: { ideal: 1920 }
        },`;

const newConstraint = `      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: "user"
        },`;

code = code.replace(targetConstraint, newConstraint);
fs.writeFileSync('src/components/CopoCreateModal.tsx', code);
