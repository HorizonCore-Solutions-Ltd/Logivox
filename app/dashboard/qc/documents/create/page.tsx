'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ArrowLeft, Save, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';

export default function CreateDocument() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [owner, setOwner] = useState('');
  const [department, setDepartment] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [trainingRequired, setTrainingRequired] = useState(false);
  const [effectiveDate, setEffectiveDate] = useState<Date>();
  const [reviewDate, setReviewDate] = useState<Date>();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a file to upload');
      return;
    }

    setLoading(true);

    try {
      // Upload file first
      const formData = new FormData();
      formData.append('file', file);

      const uploadResponse = await fetch('/api/upload/documents', {
        method: 'POST',
        body: formData
      });

      if (!uploadResponse.ok) throw new Error('File upload failed');

      const uploadResult = await uploadResponse.json();

      // Create document record
      const response = await fetch('/api/qc/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          type,
          description,
          owner,
          department,
          filePath: uploadResult.path,
          fileSize: file.size,
          fileType: file.type,
          trainingRequired,
          effectiveDate,
          reviewDate,
          organizationId: 'org-1',
          createdBy: 'current-user'
        })
      });

      if (!response.ok) throw new Error('Failed to create document');

      const result = await response.json();
      router.push(`/dashboard/qc/documents/${result.data.id}`);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Upload New Document</h1>
          <p className="text-muted-foreground">ISO 9001 Document Control</p>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Document Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Document Title *</Label>
              <Input
                placeholder="e.g., Receiving Inspection Procedure"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Document Type *</Label>
                <Select value={type} onValueChange={setType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SOP">Standard Operating Procedure (SOP)</SelectItem>
                    <SelectItem value="WORK_INSTRUCTION">Work Instruction</SelectItem>
                    <SelectItem value="FORM">Form/Template</SelectItem>
                    <SelectItem value="QUALITY_MANUAL">Quality Manual</SelectItem>
                    <SelectItem value="SPECIFICATION">Specification</SelectItem>
                    <SelectItem value="PROCEDURE">Procedure</SelectItem>
                    <SelectItem value="POLICY">Policy</SelectItem>
                    <SelectItem value="DRAWING">Drawing/Blueprint</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Department</Label>
                <Input
                  placeholder="e.g., Quality Control"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea
                placeholder="Brief description of the document purpose..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div>
              <Label>Document Owner *</Label>
              <Input
                placeholder="Person responsible for maintaining this document"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                required
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">File Upload</h3>
              <div>
                <Label>Upload Document *</Label>
                <div className="mt-2">
                  <Input
                    type="file"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    onChange={handleFileChange}
                    required
                  />
                  {file && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Effective Dates</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Effective Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {effectiveDate ? format(effectiveDate, 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <Calendar
                        mode="single"
                        selected={effectiveDate}
                        onSelect={setEffectiveDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div>
                  <Label>Next Review Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {reviewDate ? format(reviewDate, 'PPP') : 'Select date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <Calendar
                        mode="single"
                        selected={reviewDate}
                        onSelect={setReviewDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="training"
                  checked={trainingRequired}
                  onCheckedChange={(checked) => setTrainingRequired(checked as boolean)}
                />
                <Label htmlFor="training" className="cursor-pointer">
                  Requires Training & Acknowledgment
                </Label>
              </div>
              <p className="text-xs text-muted-foreground mt-2 ml-6">
                Users must read and acknowledge this document before use
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-3 mt-6">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Uploading...' : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Document
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
