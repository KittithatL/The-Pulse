import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { projectAPI } from '../services/api';
import toast from 'react-hot-toast';

const Layout = ({ children, onSearch }) => {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const fetchProjectsForNavbar = async () => {
      try {
        const res = await projectAPI.getProjects();
        setProjects(res?.data?.data?.projects ?? []);
      } catch (error) {
        console.error('Layout fetch projects error:', error);
        // ไม่ต้อง toast ทุกครั้งก็ได้ แต่ใส่ไว้ให้เห็นชัด
        toast.error('Failed to load projects');
        setProjects([]);
      }
    };

    fetchProjectsForNavbar();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar projects={projects} />

      <div className="flex-1 flex flex-col">
        <Navbar onSearch={onSearch} projects={projects} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
};

export default Layout;
