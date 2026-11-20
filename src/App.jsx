import React, { useEffect } from 'react';
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom';
import { Header, Footer, CookieNotice, TimeZoneProvider } from './components/Site';
import { HomePage, AboutPage, CoursesPage, CoursePage, ContactPage, DocumentPage } from './pages/Pages';
import { initialiseReferral } from './lib/referral';

function ScrollTop(){const {pathname}=useLocation();useEffect(()=>{window.scrollTo(0,0);},[pathname]);return null;}
function Shell(){useEffect(()=>{initialiseReferral();},[]);return <><ScrollTop/><Header/><Routes><Route path="/" element={<HomePage/>}/><Route path="/about" element={<AboutPage/>}/><Route path="/courses" element={<CoursesPage/>}/><Route path="/courses/children" element={<CoursesPage audience="Children"/>}/><Route path="/courses/students-adults" element={<CoursesPage audience="Students and Adults"/>}/><Route path="/courses/alimiyah" element={<CoursesPage audience="Alimiyah"/>}/><Route path="/course/:id" element={<CoursePage/>}/><Route path="/contact" element={<ContactPage/>}/><Route path="/documents/:slug" element={<DocumentPage/>}/><Route path="*" element={<main className="container section"><h1>Page not found</h1><a href="#/">Return home</a></main>}/></Routes><Footer/><CookieNotice/></>;}
export default function App(){return <HashRouter><TimeZoneProvider><Shell/></TimeZoneProvider></HashRouter>;}
