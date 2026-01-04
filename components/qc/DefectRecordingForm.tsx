'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Video, X } from 'lucide-react';

interface DefectRecordingFormProps {
  inspectionId: string;
  itemId: string;
  onSubmit: (data: DefectData) => Promise<void>;
  onCancel: () => void;
}

interface DefectData {
  defectType: string;
  category: string;
  quantityAffected: number;
  severity: string;
  description: string;
  photos: string[];
  videos: string[];
  rootCause?: string;
  correctiveAction?: string;
}

export default function DefectRecordingForm({
  inspectionId,
  itemId,
  onSubmit,
  onCancel,
}: DefectRecordingFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<DefectData>({
    defectType: '',
    category: '',
    quantityAffected: 1,
    severity: 'MINOR',
    description: '',
    photos: [],
    videos: [],
    rootCause: '',
    correctiveAction: '',
  });

  const defectTypes = [
    'COSMETIC',
    'FUNCTIONAL',
    'PACKAGING',
    'DIMENSION',
    'MATERIAL',
    'ASSEMBLY',
    'LABELING',
    'DOCUMENTATION',
    'OTHER',
  ];

  const categories = [
    'CRITICAL',
    'MAJOR',
    'MINOR',
  ];

  const severities = [
    'CRITICAL',
    'MAJOR',
    'MINOR',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error submitting defect:', error);
      alert('Failed to record defect');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      // In production, upload to cloud storage and get URLs
      // For now, create temporary object URLs
      const urls = Array.from(files).map((file) => URL.createObjectURL(file));
      setFormData({ ...formData, photos: [...formData.photos, ...urls] });
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const urls = Array.from(files).map((file) => URL.createObjectURL(file));
      setFormData({ ...formData, videos: [...formData.videos, ...urls] });
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...formData.photos];
    newPhotos.splice(index, 1);
    setFormData({ ...formData, photos: newPhotos });
  };

  const removeVideo = (index: number) => {
    const newVideos = [...formData.videos];
    newVideos.splice(index, 1);
    setFormData({ ...formData, videos: newVideos });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Defect Type */}
      <div>
        <Label>Defect Type *</Label>
        <select
          value={formData.defectType}
          onChange={(e) => setFormData({ ...formData, defectType: e.target.value })}
          className="w-full p-2 border rounded mt-1"
          required
        >
          <option value="">Select defect type</option>
          {defectTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Category & Severity */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Category *</Label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full p-2 border rounded mt-1"
            required
          >
            <option value="">Select category</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label>Severity *</Label>
          <select
            value={formData.severity}
            onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
            className="w-full p-2 border rounded mt-1"
            required
          >
            {severities.map((sev) => (
              <option key={sev} value={sev}>
                {sev}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Quantity Affected */}
      <div>
        <Label>Quantity Affected *</Label>
        <Input
          type="number"
          min="1"
          value={formData.quantityAffected}
          onChange={(e) =>
            setFormData({ ...formData, quantityAffected: parseInt(e.target.value) })
          }
          required
        />
      </div>

      {/* Description */}
      <div>
        <Label>Description *</Label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the defect in detail..."
          rows={4}
          required
        />
      </div>

      {/* Photos */}
      <div>
        <Label>Photos (Evidence)</Label>
        <div className="mt-2 space-y-2">
          <div className="flex gap-2">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
              id="photo-upload"
            />
            <label htmlFor="photo-upload">
              <Button type="button" variant="outline" size="sm" asChild>
                <span>
                  <Camera className="w-4 h-4 mr-2" />
                  Add Photos
                </span>
              </Button>
            </label>
          </div>
          {formData.photos.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {formData.photos.map((photo, index) => (
                <div key={index} className="relative">
                  <img
                    src={photo}
                    alt={`Defect ${index + 1}`}
                    className="w-full h-24 object-cover rounded border"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Videos */}
      <div>
        <Label>Videos (Optional)</Label>
        <div className="mt-2 space-y-2">
          <div className="flex gap-2">
            <input
              type="file"
              accept="video/*"
              multiple
              onChange={handleVideoUpload}
              className="hidden"
              id="video-upload"
            />
            <label htmlFor="video-upload">
              <Button type="button" variant="outline" size="sm" asChild>
                <span>
                  <Video className="w-4 h-4 mr-2" />
                  Add Videos
                </span>
              </Button>
            </label>
          </div>
          {formData.videos.length > 0 && (
            <div className="space-y-2">
              {formData.videos.map((video, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded">
                  <Video className="w-4 h-4" />
                  <span className="text-sm flex-1">Video {index + 1}</span>
                  <button
                    type="button"
                    onClick={() => removeVideo(index)}
                    className="text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Root Cause */}
      <div>
        <Label>Root Cause (Optional)</Label>
        <Textarea
          value={formData.rootCause}
          onChange={(e) => setFormData({ ...formData, rootCause: e.target.value })}
          placeholder="Identify the root cause if known..."
          rows={2}
        />
      </div>

      {/* Corrective Action */}
      <div>
        <Label>Corrective Action (Optional)</Label>
        <Textarea
          value={formData.correctiveAction}
          onChange={(e) => setFormData({ ...formData, correctiveAction: e.target.value })}
          placeholder="Recommended corrective actions..."
          rows={2}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Recording...' : 'Record Defect'}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
