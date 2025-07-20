import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Progress,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Code,
  Spinner,
  Alert,
  AlertIcon,
  Divider,
  useToast,
  Link,
  IconButton,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import { DownloadIcon, RepeatIcon, CloseIcon } from '@chakra-ui/icons';
import { useProjects } from '../context/ProjectContext';
import { Project, ValidationResults } from '../types';
import CodeViewer from '../components/CodeViewer';
import ValidationResultsView from '../components/ValidationResultsView';
import ArchitectureView from '../components/ArchitectureView';
import ProjectStatusBadge from '../components/ProjectStatusBadge';
import { formatDate } from '../utils/formatters';

const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  
  const ws = useRef<WebSocket | null>(null);
  const toast = useToast();
  const navigate = useNavigate();
  
  const { getProject, runProject, cancelProject } = useProjects();

  // Setup WebSocket connection
  useEffect(() => {
    if (!projectId) return;
    
    // Create WebSocket connection
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/projects/${projectId}`;
    
    ws.current = new WebSocket(wsUrl);
    
    ws.current.onopen = () => {
      console.log('WebSocket connected');
    };
    
    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        
        if (message.type === 'status_update') {
          // Update project with new status data
          setProject(prev => {
            if (!prev) return prev;
            
            return {
              ...prev,
              status: message.data.status || prev.status,
              completion_percentage: message.data.completion_percentage || prev.completion_percentage,
              current_node: message.data.current_node || prev.current_node
            };
          });
          
          // Update running state
          if (message.data.status === 'running') {
            setIsRunning(true);
          } else if (['completed', 'failed', 'cancelled'].includes(message.data.status)) {
            setIsRunning(false);
            // Reload full project data to get final results
            loadProject();
          }
        }
        else if (message.type === 'error') {
          toast({
            title: 'Error',
            description: message.data.message || 'An error occurred',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
        else if (message.type === 'completion') {
          toast({
            title: 'Project completed',
            description: 'Your application has been generated successfully',
            status: 'success',
            duration: 5000,
            isClosable: true,
          });
          loadProject(); // Reload to get final data
        }
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };
    
    ws.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.current.onclose = () => {
      console.log('WebSocket disconnected');
    };
    
    // Setup ping/pong to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.current && ws.current.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
    
    // Clean up on unmount
    return () => {
      clearInterval(pingInterval);
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [projectId]);

  // Load project data
  const loadProject = async () => {
    if (!projectId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const projectData = await getProject(projectId);
      
      if (projectData) {
        setProject(projectData);
        setIsRunning(projectData.status === 'running');
      } else {
        setError('Project not found');
      }
    } catch (err) {
      setError('Failed to load project');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadProject();
  }, [projectId]);

  // Handle run project
  const handleRunProject = async () => {
    if (!projectId) return;
    
    try {
      const success = await runProject(projectId);
      
      if (success) {
        setIsRunning(true);
        toast({
          title: 'Project started',
          description: 'The application generation has started',
          status: 'info',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error('Failed to start project');
      }
    } catch (error) {
      toast({
        title: 'Start failed',
        description: 'Failed to start the project',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handle cancel project
  const handleCancelProject = async () => {
    if (!projectId) return;
    
    try {
      const success = await cancelProject(projectId);
      
      if (success) {
        setIsRunning(false);
        toast({
          title: 'Project cancelled',
          description: 'The application generation has been cancelled',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
        
        // Reload project to get updated status
        loadProject();
      } else {
        throw new Error('Failed to cancel project');
      }
    } catch (error) {
      toast({
        title: 'Cancel failed',
        description: 'Failed to cancel the project',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handle download code
  const handleDownloadCode = () => {
    if (!projectId) return;
    
    window.location.href = `/api/projects/${projectId}/download`;
  };

  if (loading && !project) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading project...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        <Text>{error}</Text>
      </Alert>
    );
  }

  if (!project) {
    return (
      <Alert status="warning" borderRadius="md">
        <AlertIcon />
        <Text>Project not found</Text>
      </Alert>
    );
  }

  const canRun = ['created', 'failed', 'cancelled', 'completed'].includes(project.status);
  const canCancel = project.status === 'running';
  const canDownload = ['completed', 'partially_completed'].includes(project.status);

  return (
    <Box>
      <HStack justify="space-between" mb={6} align="center">
        <VStack align="start" spacing={1}>
          <Heading size="lg">{project.name}</Heading>
          <HStack>
            <ProjectStatusBadge status={project.status} />
            {project.current_node && (
              <Badge variant="outline" colorScheme="purple">
                {project.current_node}
              </Badge>
            )}
          </HStack>
        </VStack>
        
        <HStack spacing={3}>
          {canRun && (
            <Button
              leftIcon={<RepeatIcon />}
              colorScheme="blue"
              onClick={handleRunProject}
              isLoading={isRunning}
              loadingText="Running"
            >
              {project.status === 'created' ? 'Start Generation' : 'Restart Generation'}
            </Button>
          )}
          
          {canCancel && (
            <Button
              leftIcon={<CloseIcon />}
              colorScheme="red"
              variant="outline"
              onClick={handleCancelProject}
            >
              Cancel
            </Button>
          )}
          
          {canDownload && (
            <Button
              leftIcon={<DownloadIcon />}
              colorScheme="green"
              onClick={handleDownloadCode}
            >
              Download Code
            </Button>
          )}
        </HStack>
      </HStack>
      
      {/* Progress bar */}
      {(project.status === 'running' || project.completion_percentage > 0) && (
        <Box mb={6}>
          <HStack mb={2} justify="space-between">
            <Text fontWeight="medium">Generation Progress</Text>
            <Text>{Math.round(project.completion_percentage)}%</Text>
          </HStack>
          <Progress
            value={project.completion_percentage}
            size="md"
            colorScheme="blue"
            hasStripe={project.status === 'running'}
            isAnimated={project.status === 'running'}
            borderRadius="md"
          />
        </Box>
      )}
      
      {/* Project details */}
      <Grid templateColumns={{ base: "1fr", md: "1fr 2fr" }} gap={6} mb={6}>
        <GridItem>
          <Box bg="white" p={4} borderRadius="md" boxShadow="sm">
            <Heading size="sm" mb={3}>Project Details</Heading>
            <VStack align="start" spacing={2}>
              <Box>
                <Text fontWeight="semibold">Created</Text>
                <Text>{formatDate(project.created_at)}</Text>
              </Box>
              <Box>
                <Text fontWeight="semibold">Last Updated</Text>
                <Text>{formatDate(project.updated_at)}</Text>
              </Box>
              {project.errors && project.errors.length > 0 && (
                <Box>
                  <Text fontWeight="semibold" color="red.500">Errors</Text>
                  <VStack align="start" spacing={1} mt={1}>
                    {project.errors.map((error, idx) => (
                      <Text key={idx} fontSize="sm" color="red.500">{error}</Text>
                    ))}
                  </VStack>
                </Box>
              )}
            </VStack>
          </Box>
        </GridItem>
        
        <GridItem>
          <Box bg="white" p={4} borderRadius="md" boxShadow="sm">
            <Heading size="sm" mb={3}>Requirements</Heading>
            <Box
              maxH="300px"
              overflowY="auto"
              whiteSpace="pre-wrap"
              p={3}
              bg="gray.50"
              borderRadius="md"
              fontSize="sm"
            >
              {project.requirements || 'No requirements provided'}
            </Box>
          </Box>
        </GridItem>
      </Grid>
      
      {/* Project output */}
      <Tabs isLazy variant="enclosed">
        <TabList>
          <Tab>Architecture</Tab>
          <Tab>Code Files</Tab>
          <Tab>Validation Results</Tab>
          <Tab>Iteration Metrics</Tab>
        </TabList>
        
        <TabPanels>
          {/* Architecture Tab */}
          <TabPanel>
            <ArchitectureView 
              architecture={project.artifacts?.architecture || {}} 
            />
          </TabPanel>
          
          {/* Code Files Tab */}
          <TabPanel>
            <CodeViewer 
              files={project.artifacts?.code_files || {}} 
            />
          </TabPanel>
          
          {/* Validation Results Tab */}
          <TabPanel>
            <ValidationResultsView 
              validationResults={project.artifacts?.validation_results as ValidationResults || {}} 
            />
          </TabPanel>
          
          {/* Iteration Metrics Tab */}
          <TabPanel>
            {project.artifacts?.iteration_metrics ? (
              <Box>
                <Heading size="md" mb={4}>Refinement Iterations</Heading>
                <Accordion allowMultiple>
                  {project.artifacts.iteration_metrics.map((iteration, idx) => (
                    <AccordionItem key={idx}>
                      <h2>
                        <AccordionButton>
                          <Box flex="1" textAlign="left">
                            Iteration {iteration.iteration} - {iteration.issues_fixed} issues fixed
                          </Box>
                          <AccordionIcon />
                        </AccordionButton>
                      </h2>
                      <AccordionPanel pb={4}>
                        <VStack align="start" spacing={3}>
                          <Box>
                            <Text fontWeight="semibold">Issues Fixed:</Text>
                            <Text>{iteration.issues_fixed}</Text>
                          </Box>
                          <Box>
                            <Text fontWeight="semibold">Issues Remaining:</Text>
                            <Text>{iteration.issues_remaining}</Text>
                          </Box>
                          <Box w="100%">
                            <Text fontWeight="semibold" mb={1}>Validation Summary:</Text>
                            <Box bg="gray.50" p={3} borderRadius="md">
                              <Code display="block" whiteSpace="pre-wrap">
                                {JSON.stringify(iteration.validation_results, null, 2)}
                              </Code>
                            </Box>
                          </Box>
                        </VStack>
                      </AccordionPanel>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Box>
            ) : (
              <Box p={4} textAlign="center">
                <Text>No iteration metrics available</Text>
              </Box>
            )}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
};

export default ProjectDetail;