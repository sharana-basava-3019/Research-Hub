import React, { useState, useRef } from 'react';
import { toast } from 'react-toastify';

const FileUpload = ({ projectId, onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'folder'
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB for single file
  const MAX_TOTAL_SIZE = 50 * 1024 * 1024; // 50MB for folder upload

  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size exceeds 20MB limit');
      return;
    }

    setSelectedFile(file);
    setSelectedFiles([]);
    setUploadMode('file');
  };

  const handleFolderSelect = (files) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    
    // Calculate total size
    const totalSize = fileArray.reduce((sum, file) => sum + file.size, 0);
    
    // Validate total size
    if (totalSize > MAX_TOTAL_SIZE) {
      toast.error(`Total folder size (${formatFileSize(totalSize)}) exceeds 50MB limit`);
      return;
    }

    // Validate individual file sizes
    const oversizedFiles = fileArray.filter(file => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      toast.error(`Some files exceed 20MB: ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

    setSelectedFiles(fileArray);
    setSelectedFile(null);
    setUploadMode('folder');
    toast.success(`${fileArray.length} files selected (${formatFileSize(totalSize)} total)`);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const items = e.dataTransfer.items;
    
    if (!items || items.length === 0) {
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
      return;
    }

    // Check if a folder was dropped
    let hasFolder = false;
    for (let i = 0; i < items.length; i++) {
      const item = items[i].webkitGetAsEntry();
      if (item && item.isDirectory) {
        hasFolder = true;
        break;
      }
    }

    if (hasFolder) {
      // Process folder drop
      const allFiles = [];
      
      for (let i = 0; i < items.length; i++) {
        const item = items[i].webkitGetAsEntry();
        if (item) {
          await traverseFileTree(item, '', allFiles);
        }
      }
      
      if (allFiles.length > 0) {
        handleFolderSelect(allFiles);
      }
    } else {
      // Single file drop
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files[0]);
      }
    }
  };

  // Traverse directory tree for drag and drop
  const traverseFileTree = (item, path, filesList) => {
    return new Promise((resolve) => {
      if (item.isFile) {
        item.file((file) => {
          // Preserve folder structure by adding path to file
          Object.defineProperty(file, 'webkitRelativePath', {
            value: path + file.name,
            writable: false
          });
          filesList.push(file);
          resolve();
        });
      } else if (item.isDirectory) {
        const dirReader = item.createReader();
        dirReader.readEntries(async (entries) => {
          for (const entry of entries) {
            await traverseFileTree(entry, path + item.name + '/', filesList);
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleFolderInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFolderSelect(e.target.files);
    }
  };

  const handleUpload = async () => {
    if (uploadMode === 'file' && !selectedFile) {
      toast.error('Please select a file');
      return;
    }

    if (uploadMode === 'folder' && selectedFiles.length === 0) {
      toast.error('Please select a folder');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      const token = localStorage.getItem('token');

      if (uploadMode === 'file') {
        // Single file upload
        await uploadSingleFile(selectedFile, token);
      } else {
        // Multiple files upload (folder)
        await uploadMultipleFiles(selectedFiles, token);
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload files');
      setUploading(false);
    }
  };

  const uploadSingleFile = (file, token) => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percentComplete);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText);
          toast.success('File uploaded successfully!');
          setSelectedFile(null);
          setUploadProgress(0);
          if (onUploadSuccess) {
            onUploadSuccess(response.data.attachment);
          }
          setUploading(false);
          resolve();
        } else {
          const error = JSON.parse(xhr.responseText);
          toast.error(error.message || 'Upload failed');
          setUploading(false);
          reject(new Error(error.message));
        }
      });

      xhr.addEventListener('error', () => {
        toast.error('Upload failed');
        setUploading(false);
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', `http://localhost:5000/api/projects/${projectId}/attachments`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    });
  };

  const uploadMultipleFiles = async (files, token) => {
    let successCount = 0;
    let failCount = 0;
    const totalFiles = files.length;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const progress = Math.round(((i + 1) / totalFiles) * 100);
      setUploadProgress(progress);

      try {
        await uploadSingleFileSync(file, token);
        successCount++;
      } catch (error) {
        console.error(`Failed to upload ${file.name}:`, error);
        failCount++;
      }
    }

    setUploading(false);
    setSelectedFiles([]);
    setUploadProgress(0);

    if (failCount === 0) {
      toast.success(`All ${successCount} files uploaded successfully!`);
    } else if (successCount > 0) {
      toast.warning(`${successCount} files uploaded, ${failCount} failed`);
    } else {
      toast.error('All file uploads failed');
    }

    if (onUploadSuccess && successCount > 0) {
      onUploadSuccess();
    }
  };

  const uploadSingleFileSync = (file, token) => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);

      // Preserve folder structure in filename
      if (file.webkitRelativePath) {
        formData.append('relativePath', file.webkitRelativePath);
      }

      const xhr = new XMLHttpRequest();

      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          resolve();
        } else {
          reject(new Error('Upload failed'));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Network error'));
      });

      xhr.open('POST', `http://localhost:5000/api/projects/${projectId}/attachments`);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.send(formData);
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getTotalSize = () => {
    if (uploadMode === 'file' && selectedFile) {
      return selectedFile.size;
    }
    if (uploadMode === 'folder' && selectedFiles.length > 0) {
      return selectedFiles.reduce((sum, file) => sum + file.size, 0);
    }
    return 0;
  };

  return (
    <div className="card shadow-sm mb-4">
      <div className="card-body">
        <h5 className="card-title mb-3">
          <i className="bi bi-cloud-upload me-2 text-primary"></i>
          Upload File Attachment
        </h5>

        {/* Upload Mode Toggle */}
        <div className="btn-group w-100 mb-3" role="group">
          <button
            type="button"
            className={`btn ${uploadMode === 'file' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => {
              setUploadMode('file');
              setSelectedFiles([]);
            }}
            disabled={uploading}
          >
            <i className="bi bi-file-earmark me-2"></i>
            Single File
          </button>
          <button
            type="button"
            className={`btn ${uploadMode === 'folder' ? 'btn-primary' : 'btn-outline-primary'}`}
            onClick={() => {
              setUploadMode('folder');
              setSelectedFile(null);
            }}
            disabled={uploading}
          >
            <i className="bi bi-folder me-2"></i>
            Folder Upload
          </button>
        </div>

        {/* Drag and Drop Area */}
        <div
          className={`border rounded p-4 text-center ${
            dragActive ? 'border-primary bg-light' : 'border-secondary'
          }`}
          style={{
            borderStyle: 'dashed',
            borderWidth: '2px',
            transition: 'all 0.2s',
            cursor: 'pointer'
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => uploadMode === 'file' ? fileInputRef.current?.click() : folderInputRef.current?.click()}
        >
          <i className={`bi bi-${uploadMode === 'folder' ? 'folder2-open' : 'cloud-arrow-up'} display-4 text-muted mb-3`}></i>
          <p className="mb-2">
            <strong>Drag and drop your {uploadMode === 'folder' ? 'folder' : 'file'} here</strong>
          </p>
          <p className="text-muted small mb-2">or</p>
          <div className="d-flex gap-2 justify-content-center">
            {uploadMode === 'file' ? (
              <button 
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <i className="bi bi-file-earmark-plus me-1"></i>
                Browse Files
              </button>
            ) : (
              <button 
                type="button"
                className="btn btn-outline-primary btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  folderInputRef.current?.click();
                }}
              >
                <i className="bi bi-folder-plus me-1"></i>
                Browse Folders
              </button>
            )}
          </div>
          <p className="text-muted small mt-3 mb-0">
            <i className="bi bi-info-circle me-1"></i>
            {uploadMode === 'file' 
              ? 'Maximum file size: 20MB | All file formats accepted'
              : 'Maximum total size: 50MB | All file formats accepted'}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
          <input
            ref={folderInputRef}
            type="file"
            webkitdirectory=""
            directory=""
            multiple
            onChange={handleFolderInput}
            style={{ display: 'none' }}
          />
        </div>

        {/* Selected File Display */}
        {selectedFile && uploadMode === 'file' && (
          <div className="mt-3">
            <div className="alert alert-info d-flex justify-content-between align-items-center">
              <div className="d-flex align-items-center">
                <i className="bi bi-file-earmark me-2"></i>
                <div>
                  <strong>{selectedFile.name}</strong>
                  <br />
                  <small className="text-muted">{formatFileSize(selectedFile.size)}</small>
                </div>
              </div>
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => setSelectedFile(null)}
                disabled={uploading}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {/* Upload Button */}
            <button
              type="button"
              className="btn btn-primary w-100"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Uploading...
                </>
              ) : (
                <>
                  <i className="bi bi-upload me-2"></i>
                  Upload File
                </>
              )}
            </button>
          </div>
        )}

        {/* Selected Folder Display */}
        {selectedFiles.length > 0 && uploadMode === 'folder' && (
          <div className="mt-3">
            <div className="alert alert-success">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="d-flex align-items-center">
                  <i className="bi bi-folder2-open me-2 fs-4"></i>
                  <div>
                    <strong>{selectedFiles.length} files selected</strong>
                    <br />
                    <small className="text-muted">Total size: {formatFileSize(getTotalSize())}</small>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => setSelectedFiles([])}
                  disabled={uploading}
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              
              {/* File List - Show first 10 files */}
              <div className="mt-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {selectedFiles.slice(0, 10).map((file, index) => (
                  <div key={index} className="d-flex align-items-center py-1 border-bottom">
                    <i className="bi bi-file-earmark-text me-2 text-primary"></i>
                    <small className="text-truncate flex-grow-1">
                      {file.webkitRelativePath || file.name}
                    </small>
                    <small className="text-muted ms-2">{formatFileSize(file.size)}</small>
                  </div>
                ))}
                {selectedFiles.length > 10 && (
                  <div className="text-center mt-2">
                    <small className="text-muted">
                      <i className="bi bi-three-dots"></i> and {selectedFiles.length - 10} more files
                    </small>
                  </div>
                )}
              </div>
            </div>

            {/* Upload Button */}
            <button
              type="button"
              className="btn btn-success w-100"
              onClick={handleUpload}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Uploading...
                </>
              ) : (
                <>
                  <i className="bi bi-cloud-upload me-2"></i>
                  Upload {selectedFiles.length} Files
                </>
              )}
            </button>
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div className="mt-3">
            <div className="d-flex justify-content-between mb-1">
              <small className="text-muted">
                {uploadMode === 'folder' ? 'Uploading files...' : 'Uploading...'}
              </small>
              <small className="text-muted">{uploadProgress}%</small>
            </div>
            <div className="progress" style={{ height: '10px' }}>
              <div
                className="progress-bar progress-bar-striped progress-bar-animated"
                role="progressbar"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
