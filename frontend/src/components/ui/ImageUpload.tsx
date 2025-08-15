import React, { useState, useRef } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Image as ImageIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  images: File[];
  onChange: (files: File[]) => void;
  maxImages?: number;
  required?: boolean;
  label?: string;
  description?: string;
  error?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({
  images,
  onChange,
  maxImages = 5,
  required = false,
  label = "Upload Images",
  description = "Upload up to 5 high-quality images of your venue",
  error
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const validFiles: File[] = [];
    const maxFileSize = 5 * 1024 * 1024; // 5MB

    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        if (file.size <= maxFileSize) {
          validFiles.push(file);
        } else {
          console.warn(`File ${file.name} is too large. Maximum size is 5MB.`);
        }
      } else {
        console.warn(`File ${file.name} is not an image.`);
      }
    });

    const newImages = [...images, ...validFiles].slice(0, maxImages);
    onChange(newImages);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-base font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
        <p className="text-sm text-gray-600">{description}</p>
      </div>

      {/* Upload Area */}
      <Card
        className={cn(
          "border-2 border-dashed transition-colors cursor-pointer",
          dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400",
          error ? "border-red-500" : ""
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Upload className="w-8 h-8 text-gray-400" />
          </div>
          <div className="text-center">
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drop images here or click to upload
            </p>
            <p className="text-sm text-gray-600">
              Supports: JPG, PNG, WebP (Max 5MB each, up to {maxImages} images)
            </p>
          </div>
          <Button type="button" variant="outline" className="mt-4">
            <Plus className="w-4 h-4 mr-2" />
            Choose Files
          </Button>
        </CardContent>
      </Card>

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      {/* Hidden File Input */}
      <Input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Image Previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((file, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(index);
                }}
              >
                <X className="w-3 h-3" />
              </Button>
              <div className="absolute bottom-2 left-2 right-2">
                <div className="bg-black bg-opacity-50 text-white text-xs p-1 rounded text-center">
                  {file.name.length > 20 ? `${file.name.substring(0, 20)}...` : file.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Count */}
      <div className="flex justify-between text-sm text-gray-600">
        <span>{images.length} / {maxImages} images selected</span>
        {images.length > 0 && (
          <span>
            Total size: {(images.reduce((sum, file) => sum + file.size, 0) / (1024 * 1024)).toFixed(1)}MB
          </span>
        )}
      </div>
    </div>
  );
};

export default ImageUpload;
