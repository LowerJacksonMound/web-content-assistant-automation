import React, { useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Spinner,
  Link,
  useColorModeValue,
} from '@chakra-ui/react';
import { AddIcon } from '@chakra-ui/icons';
import { useProjects } from '../context/ProjectContext';
import { formatDate } from '../utils/formatters';

const Dashboard: React.FC = () => {
  const { projects, loading, error, fetchProjects } = useProjects();
  
  useEffect(() => {
    // Refresh projects data periodically
    const interval = setInterval(() => {
      fetchProjects();
    }, 10000);
    
    return () => clearInterval(interval);
  }, [fetchProjects]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'running':
        return 'blue';
      case 'failed':
      case 'cancelled':
        return 'red';
      case 'created':
        return 'purple';
      default:
        return 'gray';
    }
  };

  const tableBackgroundColor = useColorModeValue('white', 'gray.800');

  return (
    <Box>
      <HStack justify="space-between" mb={6}>
        <Heading size="lg">Application Projects</Heading>
        <Button
          as={RouterLink}
          to="/projects/new"
          colorScheme="blue"
          leftIcon={<AddIcon />}
        >
          New Project
        </Button>
      </HStack>

      {loading && projects.length === 0 ? (
        <Box textAlign="center" py={10}>
          <Spinner size="xl" />
          <Text mt={4}>Loading projects...</Text>
        </Box>
      ) : error ? (
        <Box bg="red.50" p={4} borderRadius="md">
          <Text color="red.500">{error}</Text>
        </Box>
      ) : projects.length === 0 ? (
        <Box textAlign="center" py={10} bg="gray.50" borderRadius="md">
          <Text fontSize="lg" mb={4}>No projects found</Text>
          <Button
            as={RouterLink}
            to="/projects/new"
            colorScheme="blue"
            size="lg"
          >
            Create Your First Project
          </Button>
        </Box>
      ) : (
        <Box boxShadow="sm" borderRadius="md" overflow="hidden">
          <Table variant="simple" bg={tableBackgroundColor}>
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Status</Th>
                <Th>Progress</Th>
                <Th>Created</Th>
                <Th>Last Updated</Th>
              </Tr>
            </Thead>
            <Tbody>
              {projects.map((project) => (
                <Tr key={project.project_id}>
                  <Td>
                    <Link
                      as={RouterLink}
                      to={`/projects/${project.project_id}`}
                      fontWeight="medium"
                      color="blue.600"
                      _hover={{ textDecoration: 'underline' }}
                    >
                      {project.name}
                    </Link>
                  </Td>
                  <Td>
                    <Badge colorScheme={getStatusColor(project.status)}>
                      {project.status}
                    </Badge>
                  </Td>
                  <Td>
                    {project.completion_percentage !== undefined ? 
                      `${Math.round(project.completion_percentage)}%` : 
                      'N/A'}
                  </Td>
                  <Td>{formatDate(project.created_at)}</Td>
                  <Td>{formatDate(project.updated_at)}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
    </Box>
  );
};

export default Dashboard;