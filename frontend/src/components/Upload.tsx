import { useState } from 'react';

interface UploadProps {
  onFileSelect: (file: File | null) => void;
  onPreviewChange: (preview: string | null) => void;
  imagePreview: string | null;
  disabled?: boolean;
  onError?: (error: string) => void;
}
export default function Upload({
  onFileSelect,
  onPreviewChange,
  imagePreview,
  disabled = false,
  onError,
}: UploadProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      const errorMsg = 'Image size must be less than 10MB';
      onError?.(errorMsg);
      return;
    }

    // Validate file type
    if (!file.type.match(/^image\/(jpeg|jpg|png)$/i)) {
      const errorMsg = 'Image must be JPEG or PNG format';
      onError?.(errorMsg);
      return;
    }

    onError?.('');
    setImageFile(file);
    onFileSelect(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      onPreviewChange(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    setImageFile(null);
    onFileSelect(null);
    onPreviewChange(null);
  };

  return (
    <div className="mb-6">
      <label
        htmlFor="imageUpload"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        Upload Image (Optional, max 10MB, JPEG/PNG)
      </label>
      <div className="mt-1 flex items-center space-x-4">
        <label className="cursor-pointer">
          <span className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            Choose File
          </span>
          <input
            id="imageUpload"
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleImageChange}
            className="hidden"
            disabled={disabled}
          />
        </label>
        {imageFile && (
          <span className="text-sm text-gray-600">
            {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)} MB)
          </span>
        )}
        {imagePreview && (
          <button
            type="button"
            onClick={handleClearImage}
            className="text-sm text-red-600 hover:text-red-800"
            disabled={disabled}
          >
            Clear
          </button>
        )}
      </div>

      {/* Image Preview */}
      {imagePreview && (
        <div className="mt-4">
          <img
            src={imagePreview}
            alt="Preview"
            className="max-w-full h-auto rounded-lg border border-gray-300 max-h-64 object-contain"
          />
        </div>
      )}
    </div>
  );
}
