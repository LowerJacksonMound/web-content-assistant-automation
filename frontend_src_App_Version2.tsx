import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ChakraProvider, Box, Flex, VStack, Heading, Text, theme } from '@chakra-ui/react';
import Dashboard from './pages/Dashboard';
import ProjectCreate from './pages/ProjectCreate';
import ProjectDetail from './pages/ProjectDetail';
import NavBar from './components/NavBar';
import { ProjectProvider } from './context/ProjectContext';

const App: React.FC = () => {
  return (
    <ChakraProvider theme={theme}>
      <ProjectProvider>
        <Router>
          <Box minH="100vh" bg="gray.50">
            <NavBar />
            <Box p={4}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/projects/new" element={<ProjectCreate />} />
                <Route path="/projects/:projectId" element={<ProjectDetail />} />
              </Routes>
            </Box>
          </Box>
        </Router>
      </ProjectProvider>
    </ChakraProvider>
  );
};

export default App;