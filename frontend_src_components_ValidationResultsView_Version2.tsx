import React from 'react';
import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Progress,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Alert,
  AlertIcon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  SimpleGrid,
} from '@chakra-ui/react';
import { ValidationResults } from '../types';

interface ValidationResultsViewProps {
  validationResults: ValidationResults;
}

const ValidationResultsView: React.FC<ValidationResultsViewProps> = ({ validationResults }) => {
  if (!validationResults || Object.keys(validationResults).length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Text>No validation results available</Text>
      </Box>
    );
  }

  const { security, build, linting, tests } = validationResults;
  
  // Calculate test pass rate
  const testPassRate = tests?.total ? (tests.passed / tests.total) * 100 : 0;
  
  return (
    <Box>
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} mb={6}>
        {/* Security Stats */}
        <Box bg="white" p={4} borderRadius="md" boxShadow="sm">
          <Stat>
            <StatLabel>Security Issues</StatLabel>
            <StatNumber>{security?.total_issues || 0}</StatNumber>
            <HStack mt={2}>
              <Badge colorScheme={security?.total_issues === 0 ? "green" : "red"}>
                {security?.total_issues === 0 ? "SECURE" : "ISSUES FOUND"}
              </Badge>
            </HStack>
          </Stat>
        </Box>
        
        {/* Build Stats */}
        <Box bg="white" p={4} borderRadius="md" boxShadow="sm">
          <Stat>
            <StatLabel>Build Status</StatLabel>
            <StatNumber>{build?.success ? "Success" : "Failed"}</StatNumber>
            <HStack mt={2}>
              <Badge colorScheme={build?.success ? "green" : "red"}>
                {build?.success ? "PASSING" : "FAILING"}
              </Badge>
            </HStack>
          </Stat>
        </Box>
        
        {/* Linting Stats */}
        <Box bg="white" p={4} borderRadius="md" boxShadow="sm">
          <Stat>
            <StatLabel>Linting Issues</StatLabel>
            <StatNumber>{linting?.total_issues || 0}</StatNumber>
            <HStack mt={2}>
              <Badge colorScheme={linting?.total_issues === 0 ? "green" : "yellow"}>
                {linting?.total_issues === 0 ? "CLEAN" : "WARNINGS"}
              </Badge>
            </HStack>
          </Stat>
        </Box>
        
        {/* Test Stats */}
        <Box bg="white" p={4} borderRadius="md" boxShadow="sm">
          <Stat>
            <StatLabel>Tests</StatLabel>
            <StatNumber>{tests?.passed || 0}/{tests?.total || 0}</StatNumber>
            <HStack mt={2}>
              <Progress
                value={testPassRate}
                size="sm"
                colorScheme={testPassRate > 80 ? "green" : testPassRate > 50 ? "yellow" : "red"}
                flex={1}
                borderRadius="full"
              />
              <Text fontSize="sm">{testPassRate.toFixed(0)}%</Text>
            </HStack>
          </Stat>
        </Box>
      </SimpleGrid>
      
      <Accordion allowMultiple defaultIndex={[0]}>
        {/* Security Section */}
        {security && (
          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left" fontWeight="semibold">
                  Security Scan Results
                </Box>
                <Badge colorScheme={security.total_issues === 0 ? "green" : "red"} mr={2}>
                  {security.total_issues} Issues
                </Badge>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              {security.issues && security.issues.length > 0 ? (
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>File</Th>
                      <Th>Line</Th>
                      <Th>Severity</Th>
                      <Th>Description</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {security.issues.map((issue, index) => (
                      <Tr key={index}>
                        <Td>{issue.file}</Td>
                        <Td>{issue.line}</Td>
                        <Td>
                          <Badge colorScheme={
                            issue.severity === "high" ? "red" : 
                            issue.severity === "medium" ? "orange" : "yellow"
                          }>
                            {issue.severity}
                          </Badge>
                        </Td>
                        <Td>{issue.description}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              ) : (
                <Alert status="success">
                  <AlertIcon />
                  No security issues found.
                </Alert>
              )}
            </AccordionPanel>
          </AccordionItem>
        )}
        
        {/* Build Section */}
        {build && (
          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left" fontWeight="semibold">
                  Build Results
                </Box>
                <Badge colorScheme={build.success ? "green" : "red"} mr={2}>
                  {build.success ? "SUCCESS" : "FAILED"}
                </Badge>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              {!build.success && build.errors && build.errors.length > 0 ? (
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>File</Th>
                      <Th>Line</Th>
                      <Th>Error</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {build.errors.map((error, index) => (
                      <Tr key={index}>
                        <Td>{error.file}</Td>
                        <Td>{error.line}</Td>
                        <Td>{error.message}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              ) : (
                <Alert status="success">
                  <AlertIcon />
                  Build completed successfully.
                </Alert>
              )}
            </AccordionPanel>
          </AccordionItem>
        )}
        
        {/* Linting Section */}
        {linting && (
          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left" fontWeight="semibold">
                  Linting Results
                </Box>
                <Badge colorScheme={linting.total_issues === 0 ? "green" : "yellow"} mr={2}>
                  {linting.total_issues} Issues
                </Badge>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              {linting.issues && linting.issues.length > 0 ? (
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th>File</Th>
                      <Th>Line</Th>
                      <Th>Severity</Th>
                      <Th>Message</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {linting.issues.map((issue, index) => (
                      <Tr key={index}>
                        <Td>{issue.file}</Td>
                        <Td>{issue.line}</Td>
                        <Td>
                          <Badge colorScheme={
                            issue.severity === "error" ? "red" : 
                            issue.severity === "warning" ? "yellow" : "blue"
                          }>
                            {issue.severity}
                          </Badge>
                        </Td>
                        <Td>{issue.message}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              ) : (
                <Alert status="success">
                  <AlertIcon />
                  No linting issues found.
                </Alert>
              )}
            </AccordionPanel>
          </AccordionItem>
        )}
        
        {/* Testing Section */}
        {tests && (
          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left" fontWeight="semibold">
                  Test Results
                </Box>
                <Badge colorScheme={
                  testPassRate === 100 ? "green" : 
                  testPassRate >= 80 ? "blue" : 
                  testPassRate >= 50 ? "yellow" : "red"
                } mr={2}>
                  {tests.passed}/{tests.total} Passing
                </Badge>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Text fontWeight="medium" mb={1}>Test Coverage</Text>
                  <Progress
                    value={testPassRate}
                    size="md"
                    colorScheme={
                      testPassRate === 100 ? "green" : 
                      testPassRate >= 80 ? "blue" : 
                      testPassRate >= 50 ? "yellow" : "red"
                    }
                    borderRadius="md"
                  />
                  <HStack justify="space-between" mt={1}>
                    <Text fontSize="sm">{tests.passed} Passed</Text>
                    <Text fontSize="sm">{tests.failed} Failed</Text>
                    <Text fontSize="sm">{testPassRate.toFixed(1)}% Coverage</Text>
                  </HStack>
                </Box>
                
                {tests.failures && tests.failures.length > 0 && (
                  <Box>
                    <Text fontWeight="medium" mb={2}>Failed Tests</Text>
                    <Table variant="simple" size="sm">
                      <Thead>
                        <Tr>
                          <Th>Test Name</Th>
                          <Th>File</Th>
                          <Th>Message</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {tests.failures.map((failure, index) => (
                          <Tr key={index}>
                            <Td>{failure.name || `Test #${index+1}`}</Td>
                            <Td>{failure.file}</Td>
                            <Td>{failure.message}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </Table>
                  </Box>
                )}
              </VStack>
            </AccordionPanel>
          </AccordionItem>
        )}
      </Accordion>
    </Box>
  );
};

export default ValidationResultsView;