import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  Textarea,
  VStack,
  Heading,
  Text,
  useToast,
  HStack,
  Icon,
  Divider,
} from '@chakra-ui/react';
import { FiFile, FiUpload } from 'react-icons/fi';
import { useProjects } from '../context/ProjectContext';
import { api } from '../utils/api';

const ProjectCreate: React.FC = () => {
  const [name, setName] = useState('');
  const [requirements, setRequirements] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const navigate = useNavigate();
  const toast = useToast();
  const { createProject } = useProjects();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await api.post('/api/upload-requirements', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setRequirements(response.data.requirements);
      
      toast({
        title: 'File uploaded',
        description: `Requirements loaded from ${file.name}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Failed to upload requirements file',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please provide a project name',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    if (!requirements.trim()) {
      toast({
        title: 'Requirements required',
        description: 'Please provide project requirements',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const projectId = await createProject(name, requirements);
      
      if (projectId) {
        toast({
          title: 'Project created',
          description: 'Your project has been created successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        navigate(`/projects/${projectId}`);
      } else {
        throw new Error('Failed to create project');
      }
    } catch (error) {
      toast({
        title: 'Creation failed',
        description: 'Failed to create the project',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box maxW="3xl" mx="auto">
      <Heading size="lg" mb={6}>Create New Project</Heading>
      
      <Box as="form" onSubmit={handleSubmit} bg="white" p={6} borderRadius="md" boxShadow="sm">
        <VStack spacing={6} align="stretch">
          <FormControl isRequired>
            <FormLabel>Project Name</FormLabel>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
            />
            <FormHelperText>
              Choose a descriptive name for your application
            </FormHelperText>
          </FormControl>
          
          <FormControl isRequired>
            <FormLabel>Requirements</FormLabel>
            <Box mb={2}>
              <Button
                leftIcon={<Icon as={FiUpload} />}
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                colorScheme="blue"
                variant="outline"
              >
                Upload File
              </Button>
              <Input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".txt,.md"
                display="none"
              />
            </Box>
            <Textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Enter detailed requirements for your application..."
              size="lg"
              minH="300px"
            />
            <FormHelperText>
              Provide detailed requirements including functionality, tech stack preferences, and any specific constraints
            </FormHelperText>
          </FormControl>
          
          <Divider />
          
          <HStack justify="flex-end" spacing={4}>
            <Button
              variant="outline"
              onClick={() => navigate('/')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              colorScheme="blue"
              isLoading={isLoading}
              loadingText="Creating"
            >
              Create Project
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Box>
  );
};

export default ProjectCreate;