import React, { useState } from 'react';
import {
  Box,
  Text,
  Select,
  VStack,
  HStack,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Badge,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeViewerProps {
  files: Record<string, string>;
}

const CodeViewer: React.FC<CodeViewerProps> = ({ files }) => {
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Get sorted file list
  const fileList = Object.keys(files).sort((a, b) => {
    // Sort by directory depth, then alphabetically
    const aDepth = a.split('/').length;
    const bDepth = b.split('/').length;
    if (aDepth !== bDepth) return aDepth - bDepth;
    return a.localeCompare(b);
  });
  
  // Select first file if none selected and files exist
  React.useEffect(() => {
    if (fileList.length > 0 && !selectedFile) {
      setSelectedFile(fileList[0]);
    }
  }, [fileList, selectedFile]);
  
  // Filter files by search term
  const filteredFiles = fileList.filter(file => 
    file.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Get file extension for syntax highlighting
  const getLanguage = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const languageMap: Record<string, string> = {
      js: 'javascript',
      jsx: 'jsx',
      ts: 'typescript',
      tsx: 'tsx',
      py: 'python',
      java: 'java',
      html: 'html',
      css: 'css',
      json: 'json',
      md: 'markdown',
      go: 'go',
      rs: 'rust',
      rb: 'ruby',
      php: 'php',
      c: 'c',
      cpp: 'cpp',
      cs: 'csharp',
      sh: 'bash',
      yml: 'yaml',
      yaml: 'yaml',
    };
    return languageMap[ext] || 'text';
  };
  
  // Get file type for badge
  const getFileType = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    const typeMap: Record<string, { label: string, color: string }> = {
      js: { label: 'JavaScript', color: 'yellow' },
      jsx: { label: 'React', color: 'blue' },
      ts: { label: 'TypeScript', color: 'blue' },
      tsx: { label: 'React TS', color: 'blue' },
      py: { label: 'Python', color: 'green' },
      java: { label: 'Java', color: 'red' },
      html: { label: 'HTML', color: 'orange' },
      css: { label: 'CSS', color: 'pink' },
      json: { label: 'JSON', color: 'gray' },
      md: { label: 'Markdown', color: 'purple' },
    };
    return typeMap[ext] || { label: ext.toUpperCase(), color: 'gray' };
  };

  if (fileList.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Text>No code files available</Text>
      </Box>
    );
  }

  return (
    <Box>
      <HStack mb={4} spacing={4}>
        <InputGroup maxW="300px">
          <InputLeftElement pointerEvents="none">
            <SearchIcon color="gray.300" />
          </InputLeftElement>
          <Input
            placeholder="Search files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </InputGroup>
        <Select
          value={selectedFile}
          onChange={(e) => setSelectedFile(e.target.value)}
          flex={1}
        >
          {filteredFiles.map(file => (
            <option key={file} value={file}>{file}</option>
          ))}
        </Select>
      </HStack>
      
      {selectedFile && (
        <VStack align="stretch" spacing={2}>
          <HStack>
            <Text fontWeight="bold">{selectedFile}</Text>
            {selectedFile && (
              <Badge colorScheme={getFileType(selectedFile).color}>
                {getFileType(selectedFile).label}
              </Badge>
            )}
          </HStack>
          
          <Box borderRadius="md" overflow="hidden" boxShadow="sm">
            <SyntaxHighlighter
              language={getLanguage(selectedFile)}
              style={vscDarkPlus}
              showLineNumbers={true}
              customStyle={{ margin: 0 }}
            >
              {files[selectedFile] || ''}
            </SyntaxHighlighter>
          </Box>
        </VStack>
      )}
    </Box>
  );
};

export default CodeViewer;