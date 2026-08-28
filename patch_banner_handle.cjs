const fs = require('fs');
const file = './src/components/CopoCreatorDrawer.tsx';
let content = fs.readFileSync(file, 'utf8');

const bannerHandler = `  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setBannerError("Please select a valid image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setBannerError("Image file must be under 8MB.");
      return;
    }
    setBannerError("");
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        // Banners can be wider
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          try {
            const compressedBase64 = canvas.toDataURL("image/jpeg", 0.85);
            setEditBanner(compressedBase64);
          } catch (err) {
            setBannerError("Failed to process image.");
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };
`;

content = content.replace('  const handleFileChange', bannerHandler + '  const handleFileChange');
fs.writeFileSync(file, content);
console.log("Patched banner handler");
