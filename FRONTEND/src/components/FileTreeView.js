import React, { useState, useMemo } from 'react';

const FileTreeView = ({ attachments, onDownload, onDelete, onPreview, canDelete }) => {
  const [expandedFolders, setExpandedFolders] = useState(new Set(['root']));

  // Build tree structure from flat file list
  const fileTree = useMemo(() => {
    const tree = { name: 'root', type: 'folder', children: [], files: [] };

    attachments.forEach((attachment) => {
      const pathParts = attachment.filename.split('/');
      let currentLevel = tree;

      // Navigate through folders
      for (let i = 0; i < pathParts.length - 1; i++) {
        const folderName = pathParts[i];
        let folder = currentLevel.children.find(child => child.name === folderName && child.type === 'folder');

        if (!folder) {
          folder = {
            name: folderName,
            type: 'folder',
            path: pathParts.slice(0, i + 1).join('/'),
            children: [],
            files: []
          };
          currentLevel.children.push(folder);
        }

        currentLevel = folder;
      }

      // Add file to the current folder level
      currentLevel.files.push({
        ...attachment,
        name: pathParts[pathParts.length - 1]
      });
    });

    // Sort folders and files alphabetically
    const sortTree = (node) => {
      if (node.children) {
        node.children.sort((a, b) => a.name.localeCompare(b.name));
        node.children.forEach(sortTree);
      }
      if (node.files) {
        node.files.sort((a, b) => a.name.localeCompare(b.name));
      }
    };

    sortTree(tree);
    return tree;
  }, [attachments]);

  const toggleFolder = (folderPath) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderPath)) {
        newSet.delete(folderPath);
      } else {
        newSet.add(folderPath);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    const allPaths = new Set(['root']);
    const collectPaths = (node) => {
      if (node.path) allPaths.add(node.path);
      if (node.children) {
        node.children.forEach(collectPaths);
      }
    };
    collectPaths(fileTree);
    setExpandedFolders(allPaths);
  };

  const collapseAll = () => {
    setExpandedFolders(new Set(['root']));
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const isPreviewable = (filename) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const previewableTypes = ['pdf', 'jpg', 'jpeg', 'png', 'gif', 'txt', 'md', 'json', 'csv'];
    return previewableTypes.includes(ext);
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const iconMap = {
      'pdf': 'bi-file-pdf text-danger',
      'doc': 'bi-file-word text-primary',
      'docx': 'bi-file-word text-primary',
      'xls': 'bi-file-excel text-success',
      'xlsx': 'bi-file-excel text-success',
      'ppt': 'bi-file-ppt text-warning',
      'pptx': 'bi-file-ppt text-warning',
      'zip': 'bi-file-zip text-secondary',
      'rar': 'bi-file-zip text-secondary',
      'jpg': 'bi-file-image text-info',
      'jpeg': 'bi-file-image text-info',
      'png': 'bi-file-image text-info',
      'gif': 'bi-file-image text-info',
      'txt': 'bi-file-text text-muted',
      'csv': 'bi-file-spreadsheet text-success',
      'json': 'bi-file-code text-warning',
      'js': 'bi-file-code text-warning',
      'html': 'bi-file-code text-danger',
      'css': 'bi-file-code text-primary',
      'py': 'bi-file-code text-info',
      'java': 'bi-file-code text-danger',
    };
    return iconMap[ext] || 'bi-file-earmark text-secondary';
  };

  const renderFolder = (folder, depth = 0) => {
    const isExpanded = expandedFolders.has(folder.path || 'root');
    const hasContent = folder.children.length > 0 || folder.files.length > 0;
    const paddingLeft = depth * 20;

    return (
      <div key={folder.path || 'root'}>
        {folder.name !== 'root' && (
          <div
            className="d-flex align-items-center py-2 px-2 rounded hover-bg-light cursor-pointer"
            style={{ paddingLeft: `${paddingLeft}px` }}
            onClick={() => toggleFolder(folder.path)}
          >
            <i 
              className={`bi bi-${isExpanded ? 'folder2-open' : 'folder2'} text-warning me-2`}
              style={{ fontSize: '1.1rem' }}
            ></i>
            <i 
              className={`bi bi-chevron-${isExpanded ? 'down' : 'right'} me-2 text-muted`}
              style={{ fontSize: '0.75rem' }}
            ></i>
            <span className="fw-semibold">{folder.name}</span>
            <small className="text-muted ms-2">
              ({folder.files.length + folder.children.reduce((sum, child) => sum + child.files.length, 0)} items)
            </small>
          </div>
        )}

        {isExpanded && hasContent && (
          <div>
            {/* Render subfolders */}
            {folder.children.map(child => renderFolder(child, depth + 1))}

            {/* Render files */}
            {folder.files.map(file => (
              <div
                key={file._id}
                className="d-flex align-items-center justify-content-between py-2 px-2 rounded hover-bg-light"
                style={{ paddingLeft: `${paddingLeft + 40}px` }}
              >
                <div className="d-flex align-items-center flex-grow-1">
                  <i className={`bi ${getFileIcon(file.name)} me-2`} style={{ fontSize: '1.1rem' }}></i>
                  <div>
                    <div className="text-break">{file.name}</div>
                    <small className="text-muted">
                      {formatFileSize(file.fileSize)}
                      {file.uploadedAt && ` • ${new Date(file.uploadedAt).toLocaleDateString()}`}
                    </small>
                  </div>
                </div>
                <div className="d-flex gap-1 ms-2">
                  {onPreview && isPreviewable(file.name) && (
                    <button
                      className="btn btn-sm btn-outline-info"
                      onClick={() => onPreview(file)}
                      title="Preview"
                    >
                      <i className="bi bi-eye"></i>
                    </button>
                  )}
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => onDownload(file)}
                    title="Download"
                  >
                    <i className="bi bi-download"></i>
                  </button>
                  {canDelete && (
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => onDelete(file._id)}
                      title="Delete"
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const totalFiles = attachments.length;
  const totalSize = attachments.reduce((sum, file) => sum + (file.fileSize || 0), 0);

  // Check if any folders are expanded (beyond just root)
  const hasExpandedFolders = expandedFolders.size > 1;

  const toggleAllFolders = () => {
    if (hasExpandedFolders) {
      collapseAll();
    } else {
      expandAll();
    }
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="d-flex flex-column mb-3 p-2 bg-light rounded">
        <div className="d-flex align-items-center gap-3 mb-2">
          <small className="text-muted">
            <i className="bi bi-files me-1"></i>
            {totalFiles} files
          </small>
          <small className="text-muted">
            <i className="bi bi-hdd me-1"></i>
            {formatFileSize(totalSize)} total
          </small>
        </div>
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={toggleAllFolders}
          title={hasExpandedFolders ? "Collapse All" : "Expand All"}
        >
          <i className={`bi bi-arrows-${hasExpandedFolders ? 'collapse' : 'expand'} me-1`}></i>
          {hasExpandedFolders ? 'Collapse All' : 'Expand All'}
        </button>
      </div>

      {/* File Tree */}
      <div className="border rounded p-2" style={{ maxHeight: '600px', overflowY: 'auto' }}>
        {renderFolder(fileTree)}
      </div>

      <style jsx="true">{`
        .hover-bg-light:hover {
          background-color: #f8f9fa;
        }
        .cursor-pointer {
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default FileTreeView;
