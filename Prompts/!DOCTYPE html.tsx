<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Detention Management - Test App School 2</title>
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Google Fonts: Inter -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    
    <style>
        /* Use the Inter font family */
        body {
            font-family: 'Inter', sans-serif;
            background-color: #f8fafc; /* slate-50 */
        }
        /* Custom scrollbar for a cleaner look */
        ::-webkit-scrollbar {
            width: 6px;
        }
        ::-webkit-scrollbar-track {
            background: #f1f5f9; /* slate-100 */
        }
        ::-webkit-scrollbar-thumb {
            background: #cbd5e1; /* slate-300 */
            border-radius: 3px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #94a3b8; /* slate-400 */
        }
        /* Style for active tab */
        .tab-active {
            border-bottom-color: #0ea5e9; /* sky-500 */
            color: #0c4a6e; /* sky-900 */
            font-weight: 600;
        }
        /* Hide spinner arrows on number inputs */
        input[type='number']::-webkit-inner-spin-button,
        input[type='number']::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        input[type='number'] {
            -moz-appearance: textfield;
        }
        /* Custom toggle switch styles */
        .toggle-checkbox:checked {
            right: 0;
            border-color: #0284c7; /* sky-600 */
        }
        .toggle-checkbox:checked + .toggle-label {
            background-color: #0284c7; /* sky-600 */
        }
        /* Custom tooltip styles */
        .tooltip {
            position: relative;
            display: inline-block;
        }
        .tooltip .tooltiptext {
            visibility: hidden;
            width: 120px;
            background-color: white;
            color: #334155;
            text-align: center;
            border-radius: 6px;
            padding: 5px 0;
            position: absolute;
            z-index: 1;
            bottom: 125%;
            left: 50%;
            margin-left: -60px;
            opacity: 0;
            transition: opacity 0.3s;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            border: 1px solid #e2e8f0;
        }
        .tooltip:hover .tooltiptext {
            visibility: visible;
            opacity: 1;
        }
    </style>
</head>
<body class="antialiased text-slate-700">

    <div class="flex h-screen bg-white">
        <!-- Sidebar Navigation -->
        <aside class="w-64 flex-shrink-0 border-r border-slate-200 flex flex-col">
            <div class="h-16 flex items-center px-6 border-b border-slate-200">
                <h2 class="text-lg font-semibold text-slate-800">Test App School 2</h2>
            </div>
            <nav class="flex-1 overflow-y-auto pt-6">
                <ul class="px-4 space-y-2">
                    <!-- Navigation Items -->
                    <li><a href="#" class="flex items-center gap-3 px-4 py-2 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg><span>App Engagement Overview</span></a></li>
                    <li><a href="#" class="flex items-center gap-3 px-4 py-2 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg><span>Attendance Overview</span></a></li>
                    <li><a href="#" class="flex items-center justify-between gap-3 px-4 py-2 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors"><div class="flex items-center gap-3"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"></path><path d="M16 8a6 6 0 0 0-12 0"></path></svg><span>Note from Parent</span></div><span class="bg-slate-200 text-slate-600 text-xs font-semibold px-2 py-0.5 rounded-full">2</span></a></li>
                    <li><a href="#" class="flex items-center gap-3 px-4 py-2 rounded-md bg-sky-100 text-sky-700 font-semibold"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg><span>Detention</span></a></li>
                    <li><details class="group"><summary class="flex items-center justify-between gap-3 px-4 py-2 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors cursor-pointer"><div class="flex items-center gap-3"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg><span>Personal Notification</span></div><div class="flex items-center gap-2"><span class="bg-sky-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">12</span><svg class="w-4 h-4 transition-transform group-open:rotate-90" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg></div></summary><ul class="pl-10 mt-1 space-y-1"><li><a href="#" class="block py-1 text-sm text-slate-500 hover:text-slate-800">Inbox</a></li><li><a href="#" class="block py-1 text-sm text-slate-500 hover:text-slate-800">Sent</a></li></ul></details></li>
                    <li><a href="#" class="flex items-center gap-3 px-4 py-2 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-4.44a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.38"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg><span>Manage Personal Notifications</span></a></li>
                    <li><a href="#" class="flex items-center gap-3 px-4 py-2 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg><span>PN Templates</span></a></li>
                    <li><a href="#" class="flex items-center gap-3 px-4 py-2 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.278 17.566a10 10 0 1 1-12.84-12.84"></path></svg><span>Evening Study</span></a></li>
                </ul>
            </nav>
        </aside>

        <!-- Main Content -->
        <div class="flex-1 flex flex-col bg-slate-50">
            <!-- Header Bar -->
            <header class="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200">
                <div class="flex items-center gap-4"><button class="text-slate-500 hover:text-slate-800"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg></button><div class="relative"><svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg><input type="text" placeholder="Search student name" class="pl-10 pr-4 py-2 w-80 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"></div></div>
                <div class="flex items-center"><button class="p-2 rounded-full hover:bg-slate-100"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><path d="M12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4"></path></svg></button><button class="p-2 rounded-full hover:bg-slate-100"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg></button><button class="ml-4 p-1 rounded-full border-2 border-transparent hover:border-sky-500"><svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-500"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></button></div>
            </header>

            <!-- Content Area -->
            <main class="flex-1 p-6 overflow-y-auto">

                <!-- Detention List View -->
                <div id="detention-list-view">
                    <div class="flex items-center justify-between mb-6">
                        <h1 class="text-3xl font-bold text-slate-800">Detentions</h1>
                        <div class="flex items-center gap-2">
                            <button id="add-detention-button" class="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-md hover:bg-slate-50 transition-colors shadow-sm">Add</button>
                            <button class="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-md hover:bg-slate-50 transition-colors shadow-sm"><span>Export</span><svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg></button>
                            <button id="notification-settings-button" class="p-2 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors shadow-sm"><svg class="w-5 h-5 text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg></button>
                            <button id="settings-button" class="p-2 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors shadow-sm"><svg class="w-5 h-5 text-slate-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg></button>
                        </div>
                    </div>
                    <div class="bg-white p-4 rounded-lg border border-slate-200 mb-6"><div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"><div class="relative lg:col-span-2"><svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg><input id="detention-search-name" type="text" placeholder="Search by name" class="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"></div><div><select id="detention-filter-date" class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"><option value="all">All Dates</option><option value="today">Today</option><option value="week">This Week</option><option value="month">This Month</option></select></div><div><select id="detention-filter-status" class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"><option value="all">All Statuses</option><option value="C">Completed</option><option value="P">Pending</option></select></div><div><button id="detention-clear-filters" class="w-full px-4 py-2 bg-slate-800 text-white font-semibold rounded-md hover:bg-slate-900 transition-colors">Clear filters</button></div></div></div>
                    <div class="bg-white rounded-lg border border-slate-200 overflow-hidden"><div class="overflow-x-auto"><table class="w-full text-sm text-left text-slate-600"><thead class="bg-slate-50 text-xs text-slate-500 uppercase font-semibold"><tr><th scope="col" class="p-4"><input id="detention-select-all" type="checkbox" class="w-4 h-4 text-sky-600 bg-slate-100 border-slate-300 rounded focus:ring-sky-500"></th><th scope="col" class="px-6 py-3">Detention Date</th><th scope="col" class="px-6 py-3">Time</th><th scope="col" class="px-6 py-3">Title</th><th scope="col" class="px-6 py-3">Location</th><th scope="col" class="px-6 py-3">Assigned To</th><th scope="col" class="px-6 py-3">Status</th><th scope="col" class="px-6 py-3">Assigned</th><th scope="col" class="px-6 py-3">Present</th><th scope="col" class="px-6 py-3">Absent</th><th scope="col" class="px-6 py-3">Description</th><th scope="col" class="px-6 py-3 text-center">Actions</th></tr></thead><tbody id="detention-table-body"></tbody></table></div></div>
                </div>

                <!-- Detention Details View (Student List) -->
                <div id="detention-details-view" class="hidden">
                    <div class="flex items-center gap-4 mb-6">
                         <button id="back-to-list-button" class="text-slate-500 hover:text-slate-800">
                             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
                         </button>
                         <h1 id="details-header" class="text-2xl font-bold text-slate-800"></h1>
                    </div>

                    <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <div class="flex-1 min-w-[200px]">
                            <div class="relative">
                                <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                                <input id="student-search-name" type="text" placeholder="Search by name" class="w-full pl-10 pr-4 py-2 border bg-white border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500">
                            </div>
                        </div>
                        <div class="flex flex-wrap gap-2">
                            <button id="open-add-student-modal-button" class="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-md hover:bg-slate-50 shadow-sm">Add Student</button>
                            <button id="bulk-mark-attendance-button" class="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-md hover:bg-slate-50 shadow-sm">Mark Attendance</button>
                            <button id="send-pn-button" class="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-md hover:bg-slate-50 shadow-sm">Send PN</button>
                            <button class="px-4 py-2 bg-slate-800 text-white font-semibold rounded-md hover:bg-slate-900 shadow-sm">Create Group</button>
                        </div>
                    </div>
                    
                    <div class="bg-white p-4 rounded-lg border border-slate-200 mb-6">
                        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                            <select id="student-filter-reason" class="w-full px-3 py-2 border bg-white border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"><option value="all">All Reasons</option></select>
                            <select id="student-filter-present" class="w-full px-3 py-2 border bg-white border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"><option value="all">All Present</option><option value="Y">Yes</option><option value="N">No</option><option value="NA">N/A</option></select>
                            <select id="student-filter-year" class="w-full px-3 py-2 border bg-white border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"><option value="all">All Years</option></select>
                            <select id="student-filter-class" class="w-full px-3 py-2 border bg-white border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"><option value="all">All Classes</option></select>
                            <button id="student-clear-filters" class="w-full px-4 py-2 bg-slate-800 text-white font-semibold rounded-md hover:bg-slate-900">Clear filters</button>
                        </div>
                    </div>

                    <div class="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        <div class="overflow-x-auto">
                            <table class="w-full text-sm text-left text-slate-600">
                                <thead class="bg-slate-50 text-xs text-slate-500 uppercase font-semibold">
                                    <tr>
                                        <th scope="col" class="p-4"><input id="student-select-all" type="checkbox" class="w-4 h-4 text-sky-600 bg-slate-100 border-slate-300 rounded focus:ring-sky-500"></th>
                                        <th scope="col" class="px-6 py-3">Student</th>
                                        <th scope="col" class="px-6 py-3">Year</th>
                                        <th scope="col" class="px-6 py-3">Class</th>
                                        <th scope="col" class="px-6 py-3">Reason</th>
                                        <th scope="col" class="px-6 py-3">Reason Description</th>
                                        <th scope="col" class="px-6 py-3">Attendance</th>
                                        <th scope="col" class="px-6 py-3">Contact</th>
                                        <th scope="col" class="px-6 py-3 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="student-table-body"></tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    </div>

    <!-- Add Detention Modal -->
    <div id="add-detention-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-end">
        <form id="add-detention-form" class="bg-white w-full max-w-md h-full shadow-lg flex flex-col transition-all duration-300">
            <!-- Modal Header -->
            <div class="flex justify-between items-center p-6 border-b">
                <h2 class="text-xl font-semibold text-slate-800">Add Detention</h2>
                <button id="close-add-modal-button" type="button" class="text-slate-500 hover:text-slate-800">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
            <!-- Modal Body -->
            <div class="p-6 flex-1 space-y-6 overflow-y-auto">
                <div>
                    <label for="title" class="block text-sm font-medium text-slate-700 mb-1">Title</label>
                    <div class="relative">
                        <input type="text" id="title" name="title" maxlength="50" class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="Title" required>
                        <span id="title-char-count" class="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">0/50</span>
                    </div>
                </div>

                <div id="simple-date-fields">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label for="date" class="block text-sm font-medium text-slate-700 mb-1">Date</label>
                            <input type="date" id="date" name="date" class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500" required>
                        </div>
                        <div>
                            <label for="time" class="block text-sm font-medium text-slate-700 mb-1">Time</label>
                            <select id="time" name="time" class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500" required>
                                <option value="">Select Time</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div>
                    <label for="location" class="block text-sm font-medium text-slate-700 mb-1">Location</label>
                    <select id="location" name="location" class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500" required>
                        <option value="">Select Location</option>
                        <option>Room 101</option>
                        <option>Library</option>
                        <option>Study Hall</option>
                    </select>
                </div>

                <div>
                    <label for="assign-to" class="block text-sm font-medium text-slate-700 mb-1">Assign To</label>
                    <select id="assign-to" name="assignTo" class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500" required>
                        <option value="">Select Teacher</option>
                        <option>Mr Bean</option>
                        <option>Ms Smith</option>
                        <option>Mr Jones</option>
                    </select>
                </div>

                <div>
                    <label class="flex items-center gap-2">
                        <input type="checkbox" id="is-recurring" class="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500">
                        <span>Recurring Detention</span>
                    </label>
                </div>

                <div id="recurring-options" class="hidden space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label for="start-date" class="block text-sm font-medium text-slate-700 mb-1">Start Date</label>
                            <input type="date" id="start-date" name="startDate" class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500">
                        </div>
                        <div>
                            <label for="end-date" class="block text-sm font-medium text-slate-700 mb-1">End Date</label>
                            <input type="date" id="end-date" name="endDate" class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500">
                        </div>
                    </div>
                    <div>
                        <label for="description" class="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <textarea id="description" name="description" rows="3" class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"></textarea>
                    </div>
                    <div>
                        <div class="flex justify-between items-center mb-2">
                            <label class="block text-sm font-medium text-slate-700">Recurring Days</label>
                            <span class="text-sm font-medium text-slate-800">Total Sessions: <span id="total-sessions">0</span></span>
                        </div>
                        <div class="flex flex-wrap gap-x-6 gap-y-2">
                            <label class="flex items-center gap-2"><input type="checkbox" name="recurringDays" value="1" class="recurring-day w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"> Monday</label>
                            <label class="flex items-center gap-2"><input type="checkbox" name="recurringDays" value="2" class="recurring-day w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"> Tuesday</label>
                            <label class="flex items-center gap-2"><input type="checkbox" name="recurringDays" value="3" class="recurring-day w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"> Wednesday</label>
                            <label class="flex items-center gap-2"><input type="checkbox" name="recurringDays" value="4" class="recurring-day w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"> Thursday</label>
                            <label class="flex items-center gap-2"><input type="checkbox" name="recurringDays" value="5" class="recurring-day w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"> Friday</label>
                        </div>
                    </div>
                </div>
            </div>
            <!-- Modal Footer -->
            <div class="p-6 border-t flex justify-end">
                <button type="submit" class="px-6 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-md hover:bg-slate-50 transition-colors shadow-sm">Submit</button>
            </div>
        </form>
    </div>
    
    <!-- Detention Settings Modal -->
    <div id="settings-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-start justify-end">
        <div class="bg-white w-full max-w-lg h-full shadow-lg flex flex-col">
            <!-- Modal Header -->
            <div class="flex justify-between items-center p-6 border-b">
                <h2 class="text-xl font-semibold text-slate-800">Detention Settings</h2>
                <button id="close-settings-modal-button" type="button" class="text-slate-500 hover:text-slate-800">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
            <!-- Modal Body -->
            <div class="flex-1 flex flex-col">
                <!-- Tabs -->
                <div class="border-b">
                    <nav class="flex gap-8 px-6 -mb-px">
                        <button data-tab="timeslots" class="settings-tab py-4 border-b-2 border-transparent tab-active">Timeslots</button>
                        <button data-tab="reasons" class="settings-tab py-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700">Reasons</button>
                        <button data-tab="limit" class="settings-tab py-4 border-b-2 border-transparent text-slate-500 hover:text-slate-700">Set Limit</button>
                    </nav>
                </div>

                <!-- Tab Content -->
                <div class="p-6 flex-1 bg-slate-50 overflow-y-auto">
                    <!-- Timeslots Content -->
                    <div id="timeslots-content" class="settings-tab-content">
                        <form id="add-timeslot-form" class="bg-white p-6 rounded-lg border">
                            <div class="mb-4">
                                <label for="timeslot-name" class="block text-sm font-medium text-slate-700 mb-1">Name</label>
                                <input type="text" id="timeslot-name" name="name" class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="Enter timeslot name" required>
                            </div>
                            <div class="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label class="block text-sm font-medium text-slate-700 mb-1">From Time</label>
                                    <input type="time" name="from" class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500" required>
                                </div>
                                <div>
                                    <label class="block text-sm font-medium text-slate-700 mb-1">To Time</label>
                                    <input type="time" name="to" class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500" required>
                                </div>
                            </div>
                            <button type="submit" class="w-full px-4 py-2 bg-slate-600 text-white font-semibold rounded-md hover:bg-slate-700 transition-colors">Add Timeslot</button>
                        </form>
                        <div class="mt-6 bg-white rounded-lg border">
                             <ul id="timeslots-list" class="divide-y">
                                 <!-- Timeslots will be rendered here -->
                             </ul>
                        </div>
                    </div>
                    <!-- Reasons Content -->
                    <div id="reasons-content" class="settings-tab-content hidden">
                        <div class="space-y-6">
                            <!-- Add Reason Form -->
                            <form id="add-reason-form" class="bg-white p-6 rounded-lg border">
                                <div class="space-y-4">
                                    <div>
                                        <label for="reason-input" class="block text-sm font-medium text-slate-700 mb-1">Enter reason</label>
                                        <input type="text" id="reason-input" name="reason" class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="Enter reason" required>
                                    </div>
                                    <div>
                                        <label for="reason-description-input" class="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
                                        <textarea id="reason-description-input" name="reasonDescription" rows="3" class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="Enter description for this reason"></textarea>
                                    </div>
                                    <div class="flex justify-end">
                                        <button type="submit" class="px-4 py-2 bg-slate-600 text-white font-semibold rounded-md hover:bg-slate-700 transition-colors">Add Reason</button>
                                    </div>
                                </div>
                            </form>

                            <!-- Reasons List -->
                            <div class="bg-white rounded-lg border">
                                <div class="p-4 border-b bg-slate-50">
                                    <h3 class="font-semibold text-slate-800">Reason</h3>
                                </div>
                                <ul id="reasons-list" class="divide-y">
                                    <!-- Reasons will be rendered here -->
                                </ul>
                            </div>
                        </div>
                    </div>
                    <!-- Set Limit Content -->
                    <div id="limit-content" class="settings-tab-content hidden">
                         <form id="set-limit-form" class="bg-white p-6 rounded-lg border">
                            <label for="default-student-limit" class="block text-sm font-medium text-slate-700 mb-2">Default Max Students for Detentions</label>
                            <input type="number" id="default-student-limit" min="0" class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="Enter max students (0 for unlimited)">
                            <p class="text-sm text-slate-500 mt-1 mb-4">Set to 0 for unlimited students</p>
                            <button type="submit" class="w-full px-4 py-2 bg-slate-600 text-white font-semibold rounded-md hover:bg-slate-700 transition-colors">Save Limit</button>
                         </form>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Add Student to Detention Modal -->
    <div id="add-student-modal" class="hidden fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
        <div class="bg-white w-full max-w-6xl rounded-lg shadow-lg flex flex-col max-h-[90vh]">
            <!-- Modal Header -->
            <div class="flex justify-between items-center p-5 border-b">
                <h2 class="text-xl font-semibold text-slate-800">Add Students to Detention</h2>
                <button id="close-add-student-modal-button" type="button" class="text-slate-500 hover:text-slate-800">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
            <!-- Modal Body -->
            <div class="p-5 flex-1 overflow-y-auto">
                <!-- Filters -->
                <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Years</label>
                        <select id="add-student-filter-year" class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"><option value="all">All Years</option></select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-slate-700 mb-1">Class</label>
                        <select id="add-student-filter-class" class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"><option value="all">All Classes</option></select>
                    </div>
                    <div class="flex items-end">
                        <button id="add-student-apply-filters" class="w-full px-4 py-2 bg-slate-800 text-white font-semibold rounded-md hover:bg-slate-900">Apply filter</button>
                    </div>
                    <div class="flex items-end">
                        <button id="add-student-clear-filters" class="w-full px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-md hover:bg-slate-50">Clear filter</button>
                    </div>
                </div>

                <!-- Student Lists -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Left Side: Students List -->
                    <div class="flex flex-col gap-4">
                        <h3 class="font-semibold text-slate-800">Students List</h3>
                        <div class="relative">
                             <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            <input id="add-student-search-left" type="text" placeholder="Search records" class="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500">
                        </div>
                        <div class="border rounded-lg flex-1 flex flex-col min-h-[300px] overflow-y-auto">
                            <table class="w-full text-sm text-left">
                                <thead class="bg-slate-50 sticky top-0">
                                    <tr>
                                        <th class="p-3"><input id="add-student-select-all-left" type="checkbox" class="w-4 h-4 text-sky-600 bg-slate-100 border-slate-300 rounded focus:ring-sky-500"></th>
                                        <th class="p-3 font-semibold text-slate-600">Student Name</th>
                                        <th class="p-3 font-semibold text-slate-600">Year</th>
                                        <th class="p-3 font-semibold text-slate-600">Class</th>
                                    </tr>
                                </thead>
                                <tbody id="add-student-list-left"></tbody>
                            </table>
                        </div>
                        <button id="add-to-final-list-button" class="self-center px-4 py-2 bg-slate-600 text-white font-semibold rounded-md hover:bg-slate-700">Add to Final List</button>
                    </div>
                    
                    <!-- Right Side: Final List -->
                    <div class="flex flex-col gap-4">
                        <div class="flex justify-between items-center">
                            <h3 class="font-semibold text-slate-800">Final List</h3>
                            <span id="final-list-count" class="text-sm font-medium text-slate-500"></span>
                        </div>
                        <div class="relative">
                            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                            <input id="add-student-search-right" type="text" placeholder="Search records" class="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500">
                        </div>
                        <div class="border rounded-lg flex-1 flex flex-col min-h-[270px] overflow-y-auto">
                            <table class="w-full text-sm text-left">
                                <thead class="bg-slate-50 sticky top-0">
                                    <tr>
                                        <th class="p-3"><input id="add-student-select-all-right" type="checkbox" class="w-4 h-4 text-sky-600 bg-slate-100 border-slate-300 rounded focus:ring-sky-500"></th>
                                        <th class="p-3 font-semibold text-slate-600">Student Name</th>
                                        <th class="p-3 font-semibold text-slate-600">Year</th>
                                        <th class="p-3 font-semibold text-slate-600">Class</th>
                                        <th class="p-3 font-semibold text-slate-600">Reason</th>
                                        <th class="p-3 font-semibold text-slate-600 text-center">Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="add-student-list-right"></tbody>
                            </table>
                        </div>
                        <button id="remove-from-final-list-button" class="self-center px-4 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-md hover:bg-slate-50">Remove Selected</button>
                    </div>
                </div>
            </div>
             <!-- Modal Footer -->
            <div class="p-5 border-t flex justify-end">
                <button id="add-students-to-detention-button" type="button" class="px-6 py-2 bg-slate-600 text-white font-semibold rounded-md hover:bg-slate-700 transition-colors shadow-sm">Add to Detention</button>
            </div>
        </div>
    </div>

    <!-- Edit Student Reason Description Modal (in Add Student flow) -->
    <div id="add-student-reason-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
        <form id="add-student-reason-form" class="bg-white w-full max-w-lg rounded-lg shadow-lg flex flex-col">
            <div class="flex justify-between items-center p-5 border-b">
                <h2 class="text-xl font-semibold text-slate-800">Edit Reason Description for <span id="add-student-reason-student-name"></span></h2>
                <button id="close-add-student-reason-modal-button" type="button" class="text-slate-500 hover:text-slate-800">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
            <div class="p-5">
                <label for="add-student-reason-textarea" class="block text-sm font-medium text-slate-700 mb-1">Reason Description</label>
                <textarea id="add-student-reason-textarea" rows="4" class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"></textarea>
            </div>
            <div class="p-5 border-t flex justify-end">
                <button type="submit" class="px-6 py-2 bg-slate-800 text-white font-semibold rounded-md hover:bg-slate-900 transition-colors shadow-sm">Save</button>
            </div>
        </form>
    </div>

    <!-- Edit Description Modal -->
    <div id="edit-description-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <form id="edit-description-form" class="bg-white w-full max-w-lg rounded-lg shadow-lg flex flex-col">
            <div class="flex justify-between items-center p-5 border-b">
                <h2 class="text-xl font-semibold text-slate-800">Edit Description</h2>
                <button id="close-edit-description-modal-button" type="button" class="text-slate-500 hover:text-slate-800">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
            <div class="p-5">
                <label for="edit-description-textarea" class="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea id="edit-description-textarea" rows="4" class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"></textarea>
            </div>
            <div class="p-5 border-t flex justify-end">
                <button type="submit" class="px-6 py-2 bg-slate-800 text-white font-semibold rounded-md hover:bg-slate-900 transition-colors shadow-sm">Save Changes</button>
            </div>
        </form>
    </div>

    <!-- Edit Student Reason Modal -->
    <div id="edit-student-reason-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <form id="edit-student-reason-form" class="bg-white w-full max-w-lg rounded-lg shadow-lg flex flex-col">
            <div class="flex justify-between items-center p-5 border-b">
                <h2 class="text-xl font-semibold text-slate-800">Edit Student Reason</h2>
                <button id="close-edit-student-reason-modal-button" type="button" class="text-slate-500 hover:text-slate-800">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
            <div class="p-5 space-y-4">
                <div>
                    <label for="edit-student-name" class="block text-sm font-medium text-slate-700 mb-1">Student Name</label>
                    <input type="text" id="edit-student-name" class="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50" readonly>
                </div>
                <div>
                    <label for="edit-student-reason-select" class="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                    <select id="edit-student-reason-select" class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500">
                        <option value="">Select reason</option>
                    </select>
                </div>
                <div>
                    <label for="edit-student-reason-description" class="block text-sm font-medium text-slate-700 mb-1">Reason Description</label>
                    <textarea id="edit-student-reason-description" rows="4" class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500" placeholder="Enter reason description"></textarea>
                </div>
            </div>
            <div class="p-5 border-t flex justify-end">
                <button type="submit" class="px-6 py-2 bg-slate-800 text-white font-semibold rounded-md hover:bg-slate-900 transition-colors shadow-sm">Save Changes</button>
            </div>
        </form>
    </div>
    
    <!-- Mark Attendance Modal -->
    <div id="mark-attendance-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div class="bg-white w-full max-w-sm rounded-lg shadow-lg flex flex-col">
            <div class="flex justify-between items-center p-5 border-b">
                <h2 class="text-xl font-semibold text-slate-800">Bulk Mark Attendance</h2>
                <button id="close-mark-attendance-modal-button" type="button" class="text-slate-500 hover:text-slate-800">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
            <div class="p-5 text-center">
                <p class="text-slate-600 mb-6">Mark all selected students as present or absent.</p>
                <div class="flex justify-center gap-4">
                     <button id="bulk-mark-present" class="px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors shadow-sm">Present</button>
                     <button id="bulk-mark-absent" class="px-6 py-2 bg-orange-500 text-white font-semibold rounded-md hover:bg-orange-600 transition-colors shadow-sm">Absent</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Send PN Confirmation Modal -->
    <div id="send-pn-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div class="bg-white w-full max-w-sm rounded-lg shadow-lg flex flex-col">
            <div class="flex justify-between items-center p-5 border-b">
                <h2 class="text-xl font-semibold text-slate-800">Send Personal Notification</h2>
                <button id="close-send-pn-modal-button" type="button" class="text-slate-500 hover:text-slate-800">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
            <div class="p-5 text-center">
                <p id="send-pn-message" class="text-slate-600 mb-6"></p>
                <div class="flex justify-center gap-4">
                     <button id="cancel-send-pn" class="px-6 py-2 bg-white border border-slate-300 text-slate-700 font-semibold rounded-md hover:bg-slate-50 transition-colors shadow-sm">Cancel</button>
                     <button id="confirm-send-pn" class="px-6 py-2 bg-slate-800 text-white font-semibold rounded-md hover:bg-slate-900 transition-colors shadow-sm">Continue</button>
                </div>
            </div>
        </div>
    </div>

    <!-- Send Push Notification Modal -->
    <div id="send-push-notification-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-end">
        <form id="send-push-notification-form" class="bg-white w-full max-w-md h-full shadow-lg flex flex-col">
            <div class="flex justify-between items-center p-6 border-b">
                <h2 class="text-xl font-semibold text-slate-800">Send Push Notification</h2>
                <button id="close-send-push-notification-modal-button" type="button" class="text-slate-500 hover:text-slate-800">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
            </div>
            <div class="p-6 flex-1 space-y-6 overflow-y-auto">
                <div>
                    <label for="message-template" class="block text-sm font-medium text-slate-700 mb-1">Message Template</label>
                    <select id="message-template" name="messageTemplate" class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500">
                        <option value="">Select template</option>
                    </select>
                </div>
                <div>
                    <label for="pn-message" class="block text-sm font-medium text-slate-700 mb-1">Message</label>
                    <textarea id="pn-message" name="pnMessage" rows="5" class="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500" required></textarea>
                </div>
            </div>
            <div class="p-6 border-t flex justify-end">
                <button type="submit" class="px-6 py-2 bg-slate-800 text-white font-semibold rounded-md hover:bg-slate-900 transition-colors shadow-sm">Send Push Notification</button>
            </div>
        </form>
    </div>

    <!-- Notification Banner -->
    <div id="notification-banner" class="hidden fixed top-5 right-5 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-[100] transition-transform transform translate-x-full">
        <span id="notification-message"></span>
    </div>


    <script>
        document.addEventListener('DOMContentLoaded', () => {

            // --- NOTIFICATION SYSTEM --- //
            const notificationBanner = document.getElementById('notification-banner');
            const notificationMessage = document.getElementById('notification-message');
            let notificationTimeout;

            function showNotification(message, isError = true, duration = 3000) {
                notificationMessage.textContent = message;
                
                // Toggle color based on error or success
                notificationBanner.classList.toggle('bg-red-600', isError);
                notificationBanner.classList.toggle('bg-green-600', !isError);

                notificationBanner.classList.remove('hidden');
                setTimeout(() => notificationBanner.classList.remove('translate-x-full'), 10); // Animate in

                clearTimeout(notificationTimeout);
                notificationTimeout = setTimeout(() => {
                    notificationBanner.classList.add('translate-x-full');
                     setTimeout(() => notificationBanner.classList.add('hidden'), 300); // Hide after animation
                }, duration);
            }

            // --- MOCK DATA & STATE --- //
            const state = {
                detentions: [],
                allStudents: [],
                timeslots: [
                    { id: 1, name: 'Lunch', from: '13:36', to: '14:36' },
                    { id: 2, name: 'Morning Lectures', from: '09:23', to: '10:23' },
                    { id: 3, name: 'Evening', from: '10:30', to: '11:30' },
                ],
                reasons: [
                    { name: 'Other', description: 'Other reasons not listed' },
                    { name: 'Late', description: 'Student arrived late to class' },
                    { name: 'Late Arrival', description: 'Student arrived late to school' },
                    { name: 'Uniform', description: 'Uniform policy violation' },
                    { name: 'Timing', description: 'Time-related violations' },
                    { name: 'Behaviour', description: 'Inappropriate behavior in class' }
                ],
                pnTemplates: [
                    { name: 'Absent from Detention', message: 'Dear Parent, Your child was absent from detention today. Please contact the school for more information.' },
                    { name: 'Present in Detention', message: 'Dear Parent, This is to confirm that your child attended detention today.' }
                ],
                settings: {
                    defaultMaxStudents: 30
                },
                currentView: 'list', // 'list' or 'details'
                currentDetentionId: null,
                addStudentModal: {
                    available: [],
                    selected: []
                },
                filters: {
                    detention: { name: '', date: 'all', status: 'all' },
                    student: { name: '', reason: 'all', present: 'all', year: 'all', class: 'all' },
                    addStudent: { year: 'all', class: 'all', searchLeft: '', searchRight: '' }
                }
            };

            // --- INITIALIZATION --- //
            function initializeApp() {
                // Create mock students
                const firstNames = ['Rohan', 'Jayswal', 'Sid', 'Anjali', 'Deborah', 'Martin', 'Tadhg', 'John', 'Jane', 'Peter'];
                const lastNames = ['Sharma', 'Gupta', 'Adams', 'Braun', 'Casey', 'Doe', 'Smith', 'Jones', 'Williams', 'Brown'];
                const classes = ['1A', '1B', '1C', '2A', '2B', '3A'];
                let studentId = 1;
                for (let i = 1; i <= 3; i++) { // Years 1 to 3
                    for (const className of classes) {
                        for(let j = 0; j < 5; j++) { // 5 students per class
                            state.allStudents.push({
                                id: studentId++,
                                name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
                                year: i,
                                class: className
                            });
                        }
                    }
                }

                // Create mock detentions
                state.detentions = [
                    {
                        id: 1,
                        date: '2025-07-30', // Updated to today's date
                        time: '09:23',
                        title: 'Morning Detention',
                        assignedTo: 'Mr Bean',
                        location: 'Room 101',
                        status: 'C',
                        maxStudents: 30,
                        description: 'First detention of the year.',
                        students: [
                            { id: 1, name: 'Rohan Sharma', year: 1, class: '1C', reason: 'Other', reasonDescription: 'Details about the reason.', present: 'Y' },
                            { id: 2, name: 'Jayswal Gupta', year: 1, class: '1B', reason: 'Late', reasonDescription: 'Arrived 15 minutes late.', present: 'Y' },
                            { id: 3, name: 'Sid Adams', year: 3, class: '3A', reason: 'Other', reasonDescription: '', present: 'N' },
                            { id: 4, name: 'Anjali Braun', year: 1, class: '1B', reason: 'Late', reasonDescription: 'Arrived 10 minutes late.', present: 'Y' },
                            { id: 5, name: 'Deborah Adams', year: 1, class: '1A', reason: 'Late', reasonDescription: 'Arrived 5 minutes late.', present: 'Y' },
                            { id: 6, name: 'Martin Braun', year: 1, class: '1A', reason: 'Uniform', reasonDescription: 'Incorrect shoes.', present: 'NA' },
                            { id: 7, name: 'Tadhg Casey', year: 1, class: '1C', reason: 'Late', reasonDescription: 'Arrived 20 minutes late.', present: 'NA' },
                        ]
                    },
                    {
                        id: 2,
                        date: '2025-08-01', // Updated to a date in the same week
                        time: '13:36',
                        title: 'Lunch Detention',
                        assignedTo: 'Ms Smith',
                        location: 'Library',
                        status: 'P',
                        maxStudents: 20,
                        description: 'Second detention of the year.',
                        students: [
                           { id: 8, name: 'John Doe', year: 2, class: '2A', reason: 'Behaviour', reasonDescription: 'Disruptive in class.', present: 'NA' },
                        ]
                    }
                ];
                
                // Populate static dropdowns
                populateStaticDropdowns();
                
                // Set default limit in settings
                document.getElementById('default-student-limit').value = state.settings.defaultMaxStudents;

                // Initial Render
                renderDetentionList();
                renderTimeslots();
                renderReasons();
            }
            
            function populateStaticDropdowns() {
                const studentYearFilter = document.getElementById('student-filter-year');
                const studentClassFilter = document.getElementById('student-filter-class');
                const addStudentYearFilter = document.getElementById('add-student-filter-year');
                const addStudentClassFilter = document.getElementById('add-student-filter-class');
                const studentReasonFilter = document.getElementById('student-filter-reason');

                const years = [...new Set(state.allStudents.map(s => s.year))];
                const classes = [...new Set(state.allStudents.map(s => s.class))];

                years.forEach(y => {
                    studentYearFilter.innerHTML += `<option value="${y}">Year ${y}</option>`;
                    addStudentYearFilter.innerHTML += `<option value="${y}">Year ${y}</option>`;
                });
                classes.forEach(c => {
                    studentClassFilter.innerHTML += `<option value="${c}">${c}</option>`;
                    addStudentClassFilter.innerHTML += `<option value="${c}">${c}</option>`;
                });
                state.reasons.forEach(r => {
                    const reasonName = typeof r === 'object' ? r.name : r;
                    studentReasonFilter.innerHTML += `<option value="${reasonName}">${reasonName}</option>`;
                });
            }

            // --- RENDER FUNCTIONS --- //

            /** Renders the main list of detentions based on current state and filters */
            function renderDetentionList() {
                const tableBody = document.getElementById('detention-table-body');
                tableBody.innerHTML = '';

                const filteredDetentions = state.detentions.filter(d => {
                    const filter = state.filters.detention;
                    const nameMatch = filter.name === '' || d.title.toLowerCase().includes(filter.name.toLowerCase()) || d.assignedTo.toLowerCase().includes(filter.name.toLowerCase());
                    const statusMatch = filter.status === 'all' || d.status === filter.status;
                    
                    // Date filtering logic
                    const today = new Date('2025-07-30T00:00:00'); // Set a fixed "today" for consistent filtering
                    const detentionDate = new Date(d.date + 'T00:00:00');
                    let dateMatch = true;

                    if (filter.date === 'today') {
                        dateMatch = detentionDate.toDateString() === today.toDateString();
                    } else if (filter.date === 'week') {
                        const startOfWeek = new Date(today);
                        startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)); // Adjust for week start on Monday
                        const endOfWeek = new Date(startOfWeek);
                        endOfWeek.setDate(startOfWeek.getDate() + 6);
                        dateMatch = detentionDate >= startOfWeek && detentionDate <= endOfWeek;
                    } else if (filter.date === 'month') {
                        dateMatch = detentionDate.getMonth() === today.getMonth() && detentionDate.getFullYear() === today.getFullYear();
                    }

                    return nameMatch && statusMatch && dateMatch;
                });

                if (filteredDetentions.length === 0) {
                    tableBody.innerHTML = `<tr><td colspan="12" class="text-center p-6 text-slate-500">No detentions found.</td></tr>`;
                    return;
                }

                filteredDetentions.forEach(d => {
                    const presentCount = d.students.filter(s => s.present === 'Y').length;
                    const absentCount = d.students.filter(s => s.present === 'N').length;
                    const assignedCount = d.students.length;
                    const date = new Date(d.date + 'T00:00:00');
                    const day = date.toLocaleDateString('en-US', { weekday: 'long' });
                    const formattedDate = date.toLocaleDateString('en-GB');
                    const truncatedDesc = d.description && d.description.length > 30 ? d.description.substring(0, 30) + '...' : d.description;

                    const row = `
                        <tr class="bg-white border-b border-slate-200 hover:bg-slate-50">
                            <td class="p-4"><input type="checkbox" class="detention-row-checkbox w-4 h-4 text-sky-600 bg-slate-100 border-slate-300 rounded focus:ring-sky-500"></td>
                            <td class="px-6 py-4 font-medium text-slate-800">${formattedDate}<span class="block text-xs text-slate-500 font-normal">${day}</span></td>
                            <td class="px-6 py-4">${d.time}</td>
                            <td class="px-6 py-4">${d.title}</td>
                            <td class="px-6 py-4">${d.location || 'N/A'}</td>
                            <td class="px-6 py-4">${d.assignedTo}</td>
                            <td class="px-6 py-4"><span class="inline-flex items-center justify-center w-6 h-6 text-xs font-bold ${d.status === 'C' ? 'text-green-800 bg-green-200' : 'text-amber-800 bg-amber-200'} rounded-full">${d.status}</span></td>
                            <td class="px-6 py-4">${assignedCount} / ${d.maxStudents > 0 ? d.maxStudents : '∞'}</td>
                            <td class="px-6 py-4">${presentCount}</td>
                            <td class="px-6 py-4">${absentCount}</td>
                            <td class="px-6 py-4 text-sm text-slate-600">${truncatedDesc || 'N/A'}</td>
                            <td class="px-6 py-4">
                                <div class="flex items-center justify-center gap-3 text-slate-500">
                                    <div class="tooltip">
                                        <button class="add-student-from-list-button hover:text-green-600" data-id="${d.id}">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><line x1="20" y1="8" x2="20" y2="14"></line><line x1="17" y1="11" x2="23" y2="11"></line></svg>
                                        </button>
                                        <span class="tooltiptext">Add Student</span>
                                    </div>
                                    <div class="tooltip">
                                        <button class="view-detention-button hover:text-sky-600" data-id="${d.id}"><svg class="pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></button>
                                        <span class="tooltiptext">Mark Attendance</span>
                                    </div>
                                    <button class="edit-description-button hover:text-amber-600" data-id="${d.id}"><svg class="pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg></button>
                                    <button class="delete-detention-button hover:text-red-600" data-id="${d.id}"><svg class="pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg></button>
                                </div>
                            </td>
                        </tr>
                    `;
                    tableBody.innerHTML += row;
                });
                addDetentionActionListeners();
            }

            /** Renders the student list for the currently selected detention */
            function renderStudentList() {
                const detention = state.detentions.find(d => d.id === state.currentDetentionId);
                if (!detention) return;

                const tableBody = document.getElementById('student-table-body');
                tableBody.innerHTML = '';
                
                const filteredStudents = detention.students.filter(s => {
                    const filter = state.filters.student;
                    const nameMatch = filter.name === '' || s.name.toLowerCase().includes(filter.name.toLowerCase());
                    const reasonMatch = filter.reason === 'all' || s.reason === filter.reason;
                    const presentMatch = filter.present === 'all' || s.present === filter.present;
                    const yearMatch = filter.year === 'all' || s.year == filter.year;
                    const classMatch = filter.class === 'all' || s.class === filter.class;
                    return nameMatch && reasonMatch && presentMatch && yearMatch && classMatch;
                });

                if (filteredStudents.length === 0) {
                    tableBody.innerHTML = `<tr><td colspan="9" class="text-center p-6 text-slate-500">No students found.</td></tr>`;
                    return;
                }

                filteredStudents.forEach(s => {
                    const presentBtnClasses = s.present === 'Y' ? 'bg-[#10b981] text-white' : 'bg-[#94a3b8] text-white hover:bg-slate-500';
                    const absentBtnClasses = s.present === 'N' ? 'bg-[#ef4444] text-white' : 'bg-[#94a3b8] text-white hover:bg-slate-500';

                    const row = `
                        <tr class="bg-white border-b hover:bg-slate-50">
                            <td class="p-4"><input type="checkbox" class="student-row-checkbox w-4 h-4 text-sky-600 bg-slate-100 border-slate-300 rounded focus:ring-sky-500" data-student-id="${s.id}"></td>
                            <td class="px-6 py-4 font-medium text-slate-800">${s.name}</td>
                            <td class="px-6 py-4">${s.year}</td>
                            <td class="px-6 py-4">${s.class}</td>
                            <td class="px-6 py-4">${s.reason}</td>
                            <td class="px-6 py-4">${s.reasonDescription || 'N/A'}</td>
                            <td class="px-6 py-4">
                                <div class="flex gap-2">
                                    <button class="attendance-button px-3 py-1 text-xs font-medium rounded-md ${presentBtnClasses}" data-student-id="${s.id}" data-status="Y">Present</button>
                                    <button class="attendance-button px-3 py-1 text-xs font-medium rounded-md ${absentBtnClasses}" data-student-id="${s.id}" data-status="N">Absent</button>
                                </div>
                            </td>
                            <td class="px-6 py-4"><button class="px-3 py-1 text-xs font-medium text-sky-700 bg-sky-100 rounded-md hover:bg-sky-200">View</button></td>
                            <td class="px-6 py-4">
                                <div class="flex items-center justify-center gap-3 text-slate-500">
                                    <button class="hover:text-sky-600"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg></button>
                                    <button class="edit-student-reason-button hover:text-amber-600" data-student-id="${s.id}"><svg class="pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg></button>
                                    <button class="delete-student-button hover:text-red-600" data-student-id="${s.id}"><svg class="pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>
                                </div>
                            </td>
                        </tr>
                    `;
                    tableBody.innerHTML += row;
                });
                addStudentActionListeners();
                addAttendanceActionListeners();
            }
            
            /** Renders timeslots in the settings modal and updates the add detention form dropdown */
            function renderTimeslots() {
                const list = document.getElementById('timeslots-list');
                const timeSlotSelect = document.getElementById('time');

                list.innerHTML = '';
                timeSlotSelect.innerHTML = '<option value="">Select Time</option>';

                if (state.timeslots.length === 0) {
                    list.innerHTML = `<li class="p-4 text-center text-slate-500">No timeslots defined.</li>`;
                    timeSlotSelect.innerHTML += `<option value="add-new-timeslot">Click to add a new timeslot</option>`;
                } else {
                    state.timeslots.forEach(ts => {
                        const item = `
                            <li class="p-4 flex justify-between items-center">
                                <div>
                                    <p class="font-semibold">${ts.name}</p>
                                    <p class="text-sm text-slate-500">${ts.from} - ${ts.to}</p>
                                </div>
                                <button class="delete-timeslot-button text-slate-500 hover:text-red-600" data-id="${ts.id}">
                                    <svg class="pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                </button>
                            </li>
                        `;
                        list.innerHTML += item;
                        timeSlotSelect.innerHTML += `<option value="${ts.from}">${ts.name} (${ts.from} - ${ts.to})</option>`;
                    });
                }
                addTimeslotActionListeners();
            }

            /** Renders reasons in the settings modal */
            function renderReasons() {
                const list = document.getElementById('reasons-list');
                const reasonSelects = [
                    document.getElementById('student-filter-reason'),
                ];

                list.innerHTML = '';
                
                // Update reason select dropdowns
                reasonSelects.forEach(select => {
                    if (select) {
                        const currentValue = select.value;
                        select.innerHTML = select.id === 'student-filter-reason' 
                            ? '<option value="all">All Reasons</option>' 
                            : '<option value="">Select reason</option>';
                        
                        state.reasons.forEach(reason => {
                            const reasonName = typeof reason === 'object' ? reason.name : reason;
                            select.innerHTML += `<option value="${reasonName}" ${currentValue === reasonName ? 'selected' : ''}>${reasonName}</option>`;
                        });
                    }
                });

                if (state.reasons.length === 0) {
                    list.innerHTML = `<li class="p-4 text-center text-slate-500">No reasons defined.</li>`;
                    return;
                }

                state.reasons.forEach((reason, index) => {
                    const reasonName = typeof reason === 'object' ? reason.name : reason;
                    const reasonDesc = typeof reason === 'object' ? reason.description : '';
                    
                    const item = `
                        <li class="p-4 flex justify-between items-center hover:bg-slate-50">
                            <div class="flex-1">
                                <div class="text-slate-800 font-medium">${reasonName}</div>
                                ${reasonDesc ? `<div class="text-sm text-slate-500 mt-1">${reasonDesc}</div>` : ''}
                            </div>
                            <button class="delete-reason-button text-slate-400 hover:text-red-600 transition-colors ml-4" data-index="${index}">
                                <svg class="pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </li>
                    `;
                    list.innerHTML += item;
                });
                addReasonActionListeners();
            }

            /** Renders the two lists inside the Add Student modal */
            function renderAddStudentLists() {
                const leftListBody = document.getElementById('add-student-list-left');
                const rightListBody = document.getElementById('add-student-list-right');
                leftListBody.innerHTML = '';
                rightListBody.innerHTML = '';
                
                const filter = state.filters.addStudent;

                const availableStudents = state.addStudentModal.available.filter(s => {
                    const nameMatch = filter.searchLeft === '' || s.name.toLowerCase().includes(filter.searchLeft.toLowerCase());
                    return nameMatch;
                });

                const selectedStudents = state.addStudentModal.selected.filter(s => {
                     const nameMatch = filter.searchRight === '' || s.name.toLowerCase().includes(filter.searchRight.toLowerCase());
                    return nameMatch;
                });

                if (availableStudents.length === 0) {
                    leftListBody.innerHTML = `<tr><td colspan="4" class="text-center p-4 text-slate-500">No students found.</td></tr>`;
                } else {
                    availableStudents.forEach(s => {
                        leftListBody.innerHTML += `
                            <tr class="hover:bg-slate-50">
                                <td class="p-3"><input type="checkbox" data-id="${s.id}" class="add-student-checkbox-left w-4 h-4 text-sky-600 bg-slate-100 border-slate-300 rounded focus:ring-sky-500"></td>
                                <td class="p-3">${s.name}</td>
                                <td class="p-3">${s.year}</td>
                                <td class="p-3">${s.class}</td>
                            </tr>`;
                    });
                }

                if (selectedStudents.length === 0) {
                    rightListBody.innerHTML = `<tr><td colspan="6" class="text-center p-4 text-slate-500">No students selected.</td></tr>`;
                } else {
                     selectedStudents.forEach(s => {
                        // Generate reason dropdown options
                        let reasonOptions = '<option value="">Select reason</option>';
                        state.reasons.forEach(reason => {
                            const reasonName = typeof reason === 'object' ? reason.name : reason;
                            const selected = s.reason === reasonName ? 'selected' : '';
                            reasonOptions += `<option value="${reasonName}" ${selected}>${reasonName}</option>`;
                        });

                        rightListBody.innerHTML += `
                            <tr class="hover:bg-slate-50">
                                <td class="p-3"><input type="checkbox" data-id="${s.id}" class="add-student-checkbox-right w-4 h-4 text-sky-600 bg-slate-100 border-slate-300 rounded focus:ring-sky-500"></td>
                                <td class="p-3">${s.name}</td>
                                <td class="p-3">${s.year}</td>
                                <td class="p-3">${s.class}</td>
                                <td class="p-3">
                                    <select data-student-id="${s.id}" class="student-reason-select w-full px-2 py-1 text-sm border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-sky-500">
                                        ${reasonOptions}
                                    </select>
                                </td>
                                <td class="p-3 text-center">
                                    <button class="edit-student-reason-desc-button text-slate-500 hover:text-amber-600" data-student-id="${s.id}">
                                        <svg class="pointer-events-none" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                    </button>
                                </td>
                            </tr>`;
                    });
                }
                updateCapacityDisplays();
                addStudentReasonChangeListeners();
                addStudentDescriptionActionListeners();
            }
            
            function addStudentReasonChangeListeners() {
                document.querySelectorAll('.student-reason-select').forEach(select => {
                    select.addEventListener('change', (e) => {
                        const studentId = parseInt(e.target.dataset.studentId);
                        const selectedReason = e.target.value;
                        
                        const student = state.addStudentModal.selected.find(s => s.id === studentId);
                        if (student) {
                            student.reason = selectedReason;
                        }
                    });
                });
            }

            function addStudentDescriptionActionListeners() {
                document.querySelectorAll('.edit-student-reason-desc-button').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const studentId = parseInt(e.currentTarget.dataset.studentId);
                        const student = state.addStudentModal.selected.find(s => s.id === studentId);

                        if (student) {
                            const modal = modals.addStudentReason.modal;
                            const form = modals.addStudentReason.form;
                            const textarea = document.getElementById('add-student-reason-textarea');
                            const studentNameSpan = document.getElementById('add-student-reason-student-name');

                            studentNameSpan.textContent = student.name;
                            textarea.value = student.reasonDescription || '';
                            form.dataset.studentId = studentId;
                            modal.classList.remove('hidden');
                        }
                    });
                });
            }
            
            function updateCapacityDisplays() {
                const detention = state.detentions.find(d => d.id === state.currentDetentionId);
                if (!detention) return;

                const finalListCounter = document.getElementById('final-list-count');
                
                const currentInDetention = detention.students.length;
                const selectedInModal = state.addStudentModal.selected.length;
                const totalProspective = currentInDetention + selectedInModal;
                const max = detention.maxStudents;

                if (max > 0) {
                    finalListCounter.textContent = `(${totalProspective} / ${max} students)`;
                    if (totalProspective > max) {
                        finalListCounter.classList.add('text-red-600', 'font-bold');
                        finalListCounter.classList.remove('text-slate-500');
                    } else {
                        finalListCounter.classList.remove('text-red-600', 'font-bold');
                        finalListCounter.classList.add('text-slate-500');
                    }
                } else {
                    finalListCounter.textContent = `(${totalProspective} students)`;
                    finalListCounter.classList.remove('text-red-600', 'font-bold');
                    finalListCounter.classList.add('text-slate-500');
                }
            }


            // --- EVENT HANDLERS & LOGIC --- //

            // View Switching
            function handleViewSwitch(detentionId) {
                state.currentDetentionId = detentionId;
                const detention = state.detentions.find(d => d.id === detentionId);
                if (!detention) return;

                document.getElementById('details-header').textContent = `${detention.title} - ${new Date(detention.date + 'T00:00:00').toLocaleDateString('en-GB')} at ${detention.time} | Assigned to ${detention.assignedTo}`;
                
                state.currentView = 'details';
                document.getElementById('detention-list-view').classList.add('hidden');
                document.getElementById('detention-details-view').classList.remove('hidden');
                
                renderStudentList();
            }

            document.getElementById('back-to-list-button').addEventListener('click', () => {
                state.currentView = 'list';
                state.currentDetentionId = null;
                document.getElementById('detention-details-view').classList.add('hidden');
                document.getElementById('detention-list-view').classList.remove('hidden');
            });

            // Detention List Actions & Filters
            function addDetentionActionListeners() {
                document.querySelectorAll('.view-detention-button').forEach(button => button.addEventListener('click', () => handleViewSwitch(parseInt(button.dataset.id))));
                document.querySelectorAll('.delete-detention-button').forEach(button => button.addEventListener('click', () => {
                    state.detentions = state.detentions.filter(d => d.id !== parseInt(button.dataset.id));
                    showNotification('Detention deleted.', false);
                    renderDetentionList();
                }));
                 document.querySelectorAll('.edit-description-button').forEach(button => button.addEventListener('click', () => {
                     const detentionId = parseInt(button.dataset.id);
                     const detention = state.detentions.find(d => d.id === detentionId);
                     if (detention) {
                         const modal = document.getElementById('edit-description-modal');
                         const form = document.getElementById('edit-description-form');
                         const textarea = document.getElementById('edit-description-textarea');
                         
                         textarea.value = detention.description || '';
                         form.dataset.id = detentionId; // Store id on the form
                         modal.classList.remove('hidden');
                     }
                 }));
                 document.querySelectorAll('.add-student-from-list-button').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const detentionId = parseInt(e.currentTarget.dataset.id);
                        state.currentDetentionId = detentionId;

                        const currentDetention = state.detentions.find(d => d.id === state.currentDetentionId);
                        const studentIdsInDetention = new Set(currentDetention.students.map(s => s.id));
                        
                        state.addStudentModal.available = state.allStudents.filter(s => !studentIdsInDetention.has(s.id));
                        state.addStudentModal.selected = []; // Reset selected list
                        
                        renderAddStudentLists();
                        modals.addStudent.modal.classList.remove('hidden');
                    });
                });
            }
            document.getElementById('detention-search-name').addEventListener('input', e => {
                state.filters.detention.name = e.target.value;
                renderDetentionList();
            });
            document.getElementById('detention-filter-date').addEventListener('change', e => {
                state.filters.detention.date = e.target.value;
                renderDetentionList();
            });
            document.getElementById('detention-filter-status').addEventListener('change', e => {
                state.filters.detention.status = e.target.value;
                renderDetentionList();
            });
            document.getElementById('detention-clear-filters').addEventListener('click', () => {
                state.filters.detention = { name: '', date: 'all', status: 'all' };
                document.getElementById('detention-search-name').value = '';
                document.getElementById('detention-filter-date').value = 'all';
                document.getElementById('detention-filter-status').value = 'all';
                renderDetentionList();
            });
             document.getElementById('detention-select-all').addEventListener('change', e => {
                 document.querySelectorAll('.detention-row-checkbox').forEach(cb => cb.checked = e.target.checked);
             });

            // Student List Actions & Filters
            function addStudentActionListeners() {
                 document.querySelectorAll('.delete-student-button').forEach(button => button.addEventListener('click', () => {
                     const detention = state.detentions.find(d => d.id === state.currentDetentionId);
                     detention.students = detention.students.filter(s => s.id !== parseInt(button.dataset.studentId));
                     showNotification('Student removed from detention.', false);
                     renderStudentList();
                     renderDetentionList(); // To update counts
                 }));
                
                 document.querySelectorAll('.edit-student-reason-button').forEach(button => button.addEventListener('click', () => {
                     const studentId = parseInt(button.dataset.studentId);
                     const detention = state.detentions.find(d => d.id === state.currentDetentionId);
                     const student = detention.students.find(s => s.id === studentId);
                     
                     if (student) {
                         // Populate the modal with student data
                         document.getElementById('edit-student-name').value = student.name;
                         document.getElementById('edit-student-reason-description').value = student.reasonDescription || '';
                         
                         // Populate reason select dropdown
                         const reasonSelect = document.getElementById('edit-student-reason-select');
                         reasonSelect.innerHTML = '<option value="">Select reason</option>';
                         state.reasons.forEach(reason => {
                             const reasonName = typeof reason === 'object' ? reason.name : reason;
                             const option = document.createElement('option');
                             option.value = reasonName;
                             option.textContent = reasonName;
                             if (student.reason === reasonName) {
                                 option.selected = true;
                             }
                             reasonSelect.appendChild(option);
                         });
                         
                         // Set the student ID in the form for submission
                         document.getElementById('edit-student-reason-form').dataset.studentId = studentId;
                         
                         // Open the modal
                         document.getElementById('edit-student-reason-modal').classList.remove('hidden');
                     }
                 }));
            }

            function addAttendanceActionListeners() {
                document.querySelectorAll('.attendance-button').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const studentId = parseInt(e.target.dataset.studentId);
                        const status = e.target.dataset.status;
                        const detention = state.detentions.find(d => d.id === state.currentDetentionId);
                        if (detention) {
                            const student = detention.students.find(s => s.id === studentId);
                            if (student) {
                                // Toggle functionality: if clicking the same status, set to 'NA'
                                student.present = student.present === status ? 'NA' : status;
                                renderStudentList();
                                renderDetentionList(); // Update counts
                            }
                        }
                    });
                });
            }

            document.getElementById('student-search-name').addEventListener('input', e => {
                state.filters.student.name = e.target.value;
                renderStudentList();
            });
            
            ['student-filter-reason', 'student-filter-present', 'student-filter-year', 'student-filter-class'].forEach(id => {
                document.getElementById(id).addEventListener('change', e => {
                    const filterKey = id.split('-')[2];
                    state.filters.student[filterKey] = e.target.value;
                    renderStudentList();
                });
            });

            document.getElementById('student-clear-filters').addEventListener('click', () => {
                state.filters.student = { name: '', reason: 'all', present: 'all', year: 'all', class: 'all' };
                document.getElementById('student-search-name').value = '';
                document.getElementById('student-filter-reason').value = 'all';
                document.getElementById('student-filter-present').value = 'all';
                document.getElementById('student-filter-year').value = 'all';
                document.getElementById('student-filter-class').value = 'all';
                renderStudentList();
            });
            document.getElementById('student-select-all').addEventListener('change', e => {
                document.querySelectorAll('.student-row-checkbox').forEach(cb => cb.checked = e.target.checked);
            });


            // Modal Handling
            const modals = {
                addDetention: {
                    button: document.getElementById('add-detention-button'),
                    modal: document.getElementById('add-detention-modal'),
                    closeButton: document.getElementById('close-add-modal-button'),
                    form: document.getElementById('add-detention-form'),
                },
                settings: {
                    button: document.getElementById('settings-button'),
                    modal: document.getElementById('settings-modal'),
                    closeButton: document.getElementById('close-settings-modal-button'),
                },
                addStudent: {
                    button: document.getElementById('open-add-student-modal-button'),
                    modal: document.getElementById('add-student-modal'),
                    closeButton: document.getElementById('close-add-student-modal-button'),
                },
                addStudentReason: {
                    modal: document.getElementById('add-student-reason-modal'),
                    closeButton: document.getElementById('close-add-student-reason-modal-button'),
                    form: document.getElementById('add-student-reason-form'),
                },
                editDescription: {
                    modal: document.getElementById('edit-description-modal'),
                    closeButton: document.getElementById('close-edit-description-modal-button'),
                    form: document.getElementById('edit-description-form'),
                },
                editStudentReason: {
                    modal: document.getElementById('edit-student-reason-modal'),
                    closeButton: document.getElementById('close-edit-student-reason-modal-button'),
                    form: document.getElementById('edit-student-reason-form'),
                },
                markAttendance: {
                    button: document.getElementById('bulk-mark-attendance-button'),
                    modal: document.getElementById('mark-attendance-modal'),
                    closeButton: document.getElementById('close-mark-attendance-modal-button'),
                },
                sendPN: {
                    button: document.getElementById('send-pn-button'),
                    modal: document.getElementById('send-pn-modal'),
                    closeButton: document.getElementById('close-send-pn-modal-button'),
                },
                sendPushNotification: {
                    modal: document.getElementById('send-push-notification-modal'),
                    closeButton: document.getElementById('close-send-push-notification-modal-button'),
                    form: document.getElementById('send-push-notification-form'),
                }
            };

            function setupModal(modalConfig) {
                if (modalConfig.button) { // Not all modals have an opener button
                    modalConfig.button.addEventListener('click', () => {
                         // Special check for bulk attendance
                        if (modalConfig.button.id === 'bulk-mark-attendance-button' || modalConfig.button.id === 'send-pn-button') {
                            const selectedStudents = document.querySelectorAll('.student-row-checkbox:checked');
                            if (selectedStudents.length === 0) {
                                showNotification('Please select at least one student.');
                                return;
                            }
                        }
                        if (modalConfig.button.id === 'send-pn-button') {
                            const studentCount = document.querySelectorAll('.student-row-checkbox:checked').length;
                            const message = `Are you sure you want to send a PN to ${studentCount} student${studentCount > 1 ? 's' : ''}?`;
                            document.getElementById('send-pn-message').textContent = message;
                        }
                        modalConfig.modal.classList.remove('hidden')
                    });
                }
                modalConfig.closeButton.addEventListener('click', () => modalConfig.modal.classList.add('hidden'));
                modalConfig.modal.addEventListener('click', (e) => {
                    if (e.target === modalConfig.modal) modalConfig.modal.classList.add('hidden');
                });
            }

            Object.values(modals).forEach(setupModal);
            
            // Add event listener for the time slot dropdown
            document.getElementById('time').addEventListener('change', (e) => {
                if (e.target.value === 'add-new-timeslot') {
                    // Open settings modal
                    modals.settings.modal.classList.remove('hidden');

                    // Switch to the timeslots tab
                    document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('tab-active'));
                    document.querySelectorAll('.settings-tab-content').forEach(c => c.classList.add('hidden'));
                    
                    const timeslotsTab = document.querySelector('.settings-tab[data-tab="timeslots"]');
                    const timeslotsContent = document.getElementById('timeslots-content');

                    timeslotsTab.classList.add('tab-active');
                    timeslotsContent.classList.remove('hidden');
                    
                    // Reset the select so the user can choose a new time after adding one
                    e.target.value = ""; 
                }
            });

            // Add Detention Form
            modals.addDetention.form.addEventListener('submit', e => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const isRecurring = document.getElementById('is-recurring').checked;
                
                if (isRecurring) {
                    const title = formData.get('title');
                    const startDateStr = formData.get('startDate');
                    const endDateStr = formData.get('endDate');
                    const timeSlot = formData.get('time');
                    const location = formData.get('location');
                    const assignTo = formData.get('assignTo');
                    const description = formData.get('description');
                    const recurringDays = formData.getAll('recurringDays').map(Number);
                    
                    if (!startDateStr || !endDateStr || !timeSlot || !assignTo || !location || recurringDays.length === 0) {
                        showNotification('Please fill all required fields for recurring detention.');
                        return;
                    }

                    const startDate = new Date(startDateStr + 'T00:00:00');
                    const endDate = new Date(endDateStr + 'T00:00:00');

                    if (endDate < startDate) {
                        showNotification('End date cannot be before start date.');
                        return;
                    }

                    let currentDate = new Date(startDate);
                    let newDetentionId = Date.now();

                    while(currentDate <= endDate) {
                        const dayOfWeek = currentDate.getDay(); // Sunday is 0, Monday is 1, etc.
                        if(recurringDays.includes(dayOfWeek)) {
                            state.detentions.push({
                                id: newDetentionId++, date: currentDate.toISOString().split('T')[0], time: timeSlot, title, location, assignedTo: assignTo, description, status: 'P', students: [], maxStudents: state.settings.defaultMaxStudents
                            });
                        }
                        currentDate.setDate(currentDate.getDate() + 1);
                    }
                } else {
                     state.detentions.push({
                         id: Date.now(),
                         date: formData.get('date'),
                         time: formData.get('time'),
                         title: formData.get('title'),
                         location: formData.get('location'),
                         assignedTo: formData.get('assignTo'),
                         description: '',
                         status: 'P',
                         students: [],
                         maxStudents: state.settings.defaultMaxStudents
                     });
                }

                renderDetentionList();
                e.target.reset();
                document.getElementById('total-sessions').textContent = 0;
                document.getElementById('recurring-options').classList.add('hidden');
                document.getElementById('simple-date-fields').classList.remove('hidden');
                document.getElementById('add-detention-form').classList.remove('max-w-2xl');
                document.getElementById('add-detention-form').classList.add('max-w-md');
                modals.addDetention.modal.classList.add('hidden');
                showNotification('Detention(s) added successfully.', false);
            });

            document.getElementById('is-recurring').addEventListener('change', e => {
                const recurringOptions = document.getElementById('recurring-options');
                const simpleDateFields = document.getElementById('simple-date-fields');
                const form = document.getElementById('add-detention-form');

                if (e.target.checked) {
                    recurringOptions.classList.remove('hidden');
                    simpleDateFields.classList.add('hidden');
                    form.classList.add('max-w-2xl');
                    form.classList.remove('max-w-md');
                } else {
                    recurringOptions.classList.add('hidden');
                    simpleDateFields.classList.remove('hidden');
                    form.classList.remove('max-w-2xl');
                    form.classList.add('max-w-md');
                }
            });

            const addDetentionFormElements = [
                document.getElementById('start-date'),
                document.getElementById('end-date'),
                ...document.querySelectorAll('.recurring-day')
            ];

            function calculateTotalSessions() {
                const startDateStr = document.getElementById('start-date').value;
                const endDateStr = document.getElementById('end-date').value;

                if (!startDateStr || !endDateStr) {
                    document.getElementById('total-sessions').textContent = 0;
                    return;
                }

                const startDate = new Date(startDateStr + 'T00:00:00');
                const endDate = new Date(endDateStr + 'T00:00:00');
                const recurringDays = [...document.querySelectorAll('.recurring-day:checked')].map(cb => Number(cb.value));
                const totalSessionsEl = document.getElementById('total-sessions');

                if (isNaN(startDate) || isNaN(endDate) || endDate < startDate || recurringDays.length === 0) {
                    totalSessionsEl.textContent = 0;
                    return;
                }
                
                let count = 0;
                let currentDate = new Date(startDate);
                while(currentDate <= endDate) {
                    if(recurringDays.includes(currentDate.getDay())) {
                        count++;
                    }
                    currentDate.setDate(currentDate.getDate() + 1);
                }
                totalSessionsEl.textContent = count;
            }

            addDetentionFormElements.forEach(el => el.addEventListener('change', calculateTotalSessions));
            document.getElementById('title').addEventListener('input', e => {
                document.getElementById('title-char-count').textContent = `${e.target.value.length}/50`;
            });

            // Edit Description Form
            modals.editDescription.form.addEventListener('submit', e => {
                e.preventDefault();
                const detentionId = parseInt(e.target.dataset.id);
                const newDescription = document.getElementById('edit-description-textarea').value;
                const detention = state.detentions.find(d => d.id === detentionId);
                if (detention) {
                    detention.description = newDescription;
                    renderDetentionList();
                    showNotification('Description updated successfully.', false);
                    modals.editDescription.modal.classList.add('hidden');
                }
            });

            // Edit Student Reason Form
            modals.editStudentReason.form.addEventListener('submit', e => {
                e.preventDefault();
                const studentId = parseInt(e.target.dataset.studentId);
                const newReason = document.getElementById('edit-student-reason-select').value;
                const newReasonDescription = document.getElementById('edit-student-reason-description').value;
                
                const detention = state.detentions.find(d => d.id === state.currentDetentionId);
                if (detention) {
                    const student = detention.students.find(s => s.id === studentId);
                    if (student) {
                        student.reason = newReason;
                        student.reasonDescription = newReasonDescription;
                        renderStudentList();
                        renderDetentionList(); // To update any reason display in the main list
                        showNotification('Student reason updated successfully.', false);
                        modals.editStudentReason.modal.classList.add('hidden');
                    }
                }
            });

            // Add Student Reason Description Modal Form
            modals.addStudentReason.form.addEventListener('submit', e => {
                e.preventDefault();
                const studentId = parseInt(e.currentTarget.dataset.studentId);
                const newDescription = document.getElementById('add-student-reason-textarea').value;

                const student = state.addStudentModal.selected.find(s => s.id === studentId);
                if (student) {
                    student.reasonDescription = newDescription;
                }

                modals.addStudentReason.modal.classList.add('hidden');
                showNotification('Reason description updated.', false);
            });


            // Settings Modal Tabs & Timeslots
            document.querySelectorAll('.settings-tab').forEach(tab => {
                tab.addEventListener('click', () => {
                    document.querySelectorAll('.settings-tab').forEach(t => t.classList.remove('tab-active'));
                    document.querySelectorAll('.settings-tab-content').forEach(c => c.classList.add('hidden'));
                    
                    tab.classList.add('tab-active');
                    document.getElementById(`${tab.dataset.tab}-content`).classList.remove('hidden');
                });
            });

            document.getElementById('add-timeslot-form').addEventListener('submit', e => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const newTimeslot = {
                    id: Date.now(),
                    name: formData.get('name'),
                    from: formData.get('from'),
                    to: formData.get('to')
                };
                state.timeslots.push(newTimeslot);
                renderTimeslots();
                e.target.reset();
            });
            
            function addTimeslotActionListeners() {
                document.querySelectorAll('.delete-timeslot-button').forEach(button => button.addEventListener('click', () => {
                    state.timeslots = state.timeslots.filter(ts => ts.id !== parseInt(button.dataset.id));
                    renderTimeslots();
                }));
            }

            // Reasons Form and Event Handlers
            document.getElementById('add-reason-form').addEventListener('submit', e => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const newReasonName = formData.get('reason').trim();
                const newReasonDescription = formData.get('reasonDescription').trim();
                
                if (!newReasonName) {
                    showNotification('Please enter a reason.');
                    return;
                }
                
                // Check if reason name already exists
                const reasonExists = state.reasons.some(reason => {
                    const existingName = typeof reason === 'object' ? reason.name : reason;
                    return existingName.toLowerCase() === newReasonName.toLowerCase();
                });
                
                if (reasonExists) {
                    showNotification('This reason already exists.');
                    return;
                }
                
                const newReason = {
                    name: newReasonName,
                    description: newReasonDescription
                };
                
                state.reasons.push(newReason);
                renderReasons();
                e.target.reset();
                showNotification('Reason added successfully.', false);
            });
            
            function addReasonActionListeners() {
                document.querySelectorAll('.delete-reason-button').forEach(button => button.addEventListener('click', () => {
                    const reasonIndex = parseInt(button.dataset.index);
                    const reasonToDelete = state.reasons[reasonIndex];
                    const reasonName = typeof reasonToDelete === 'object' ? reasonToDelete.name : reasonToDelete;
                    
                    // Check if reason is being used in any detention
                    const isReasonInUse = state.detentions.some(detention => 
                        detention.students.some(student => student.reason === reasonName)
                    );
                    
                    if (isReasonInUse) {
                        showNotification('Cannot delete reason as it is currently being used in detentions.');
                        return;
                    }
                    
                    state.reasons.splice(reasonIndex, 1);
                    renderReasons();
                    showNotification('Reason deleted successfully.', false);
                }));
            }

            document.getElementById('set-limit-form').addEventListener('submit', e => {
                e.preventDefault();
                const input = document.getElementById('default-student-limit');
                const value = parseInt(input.value, 10);

                if (isNaN(value) || value < 0) {
                    showNotification('Please enter a valid number (0 or greater).');
                    input.value = state.settings.defaultMaxStudents; // Reset to previous value
                    return;
                }

                if (value > 200) {
                    showNotification('Maximum limit cannot exceed 200 students.');
                    input.value = state.settings.defaultMaxStudents; // Reset to previous value
                    return;
                }

                state.settings.defaultMaxStudents = value;
                showNotification('Default student limit updated successfully.', false);
            });

            // Add Student Modal Logic
            modals.addStudent.button.addEventListener('click', () => {
                const currentDetention = state.detentions.find(d => d.id === state.currentDetentionId);
                const studentIdsInDetention = new Set(currentDetention.students.map(s => s.id));
                
                state.addStudentModal.available = state.allStudents.filter(s => !studentIdsInDetention.has(s.id));
                state.addStudentModal.selected = []; // Reset selected list
                
                renderAddStudentLists();
            });

            // Add Student Modal Search and Filter Handlers
            document.getElementById('add-student-search-left').addEventListener('input', e => {
                state.filters.addStudent.searchLeft = e.target.value;
                renderAddStudentLists();
            });

            document.getElementById('add-student-search-right').addEventListener('input', e => {
                state.filters.addStudent.searchRight = e.target.value;
                renderAddStudentLists();
            });

            document.getElementById('add-student-apply-filters').addEventListener('click', () => {
                const yearFilter = document.getElementById('add-student-filter-year').value;
                const classFilter = document.getElementById('add-student-filter-class').value;
                
                state.filters.addStudent.year = yearFilter;
                state.filters.addStudent.class = classFilter;
                
                // Apply filters to available students
                const currentDetention = state.detentions.find(d => d.id === state.currentDetentionId);
                const studentIdsInDetention = new Set(currentDetention.students.map(s => s.id));
                
                state.addStudentModal.available = state.allStudents.filter(s => {
                    if (studentIdsInDetention.has(s.id)) return false;
                    if (yearFilter !== 'all' && s.year.toString() !== yearFilter) return false;
                    if (classFilter !== 'all' && s.class !== classFilter) return false;
                    return true;
                });
                
                renderAddStudentLists();
            });

            document.getElementById('add-student-clear-filters').addEventListener('click', () => {
                state.filters.addStudent = { year: 'all', class: 'all', searchLeft: '', searchRight: '' };
                document.getElementById('add-student-filter-year').value = 'all';
                document.getElementById('add-student-filter-class').value = 'all';
                document.getElementById('add-student-search-left').value = '';
                document.getElementById('add-student-search-right').value = '';
                
                // Reset to all available students
                const currentDetention = state.detentions.find(d => d.id === state.currentDetentionId);
                const studentIdsInDetention = new Set(currentDetention.students.map(s => s.id));
                state.addStudentModal.available = state.allStudents.filter(s => !studentIdsInDetention.has(s.id));
                
                renderAddStudentLists();
            });
            
            document.getElementById('add-to-final-list-button').addEventListener('click', () => {
                const selectedIds = new Set();
                document.querySelectorAll('.add-student-checkbox-left:checked').forEach(cb => {
                    selectedIds.add(parseInt(cb.dataset.id));
                });
                
                const toMove = state.addStudentModal.available
                    .filter(s => selectedIds.has(s.id))
                    .map(s => ({...s, reason: '', reasonDescription: ''})); // Add default reason properties

                state.addStudentModal.selected.push(...toMove);
                state.addStudentModal.available = state.addStudentModal.available.filter(s => !selectedIds.has(s.id));
                
                renderAddStudentLists();
            });

            document.getElementById('remove-from-final-list-button').addEventListener('click', () => {
                const selectedIds = new Set();
                document.querySelectorAll('.add-student-checkbox-right:checked').forEach(cb => {
                    selectedIds.add(parseInt(cb.dataset.id));
                });

                const toMove = state.addStudentModal.selected.filter(s => selectedIds.has(s.id));
                state.addStudentModal.available.push(...toMove);
                state.addStudentModal.selected = state.addStudentModal.selected.filter(s => !selectedIds.has(s.id));

                renderAddStudentLists();
            });

            document.getElementById('add-students-to-detention-button').addEventListener('click', () => {
                // Check if all students have reasons selected
                const studentsWithoutReason = state.addStudentModal.selected.filter(s => !s.reason);
                
                if (studentsWithoutReason.length > 0) {
                    showNotification('Please select a reason for all students in the final list.');
                    return;
                }

                const detention = state.detentions.find(d => d.id === state.currentDetentionId);
                const max = detention.maxStudents > 0 ? detention.maxStudents : Infinity;
                const currentCount = detention.students.length;
                const newCount = state.addStudentModal.selected.length;

                if ((currentCount + newCount) > max) {
                    showNotification(`This will exceed the maximum of ${max} students. Please remove ${ (currentCount + newCount) - max } student(s) from the final list.`);
                    return;
                }

                const newStudents = state.addStudentModal.selected.map(s => ({...s, present: 'NA'}));
                
                detention.students.push(...newStudents);
                
                renderStudentList();
                renderDetentionList(); // Update counts on main list
                modals.addStudent.modal.classList.add('hidden');
                showNotification(`${newCount} student(s) added successfully.`, false);

            });
            
            // Bulk attendance logic
            function handleBulkAttendance(status) {
                const selectedStudentIds = new Set();
                document.querySelectorAll('.student-row-checkbox:checked').forEach(cb => {
                    selectedStudentIds.add(parseInt(cb.dataset.studentId));
                });

                const detention = state.detentions.find(d => d.id === state.currentDetentionId);
                if (detention) {
                    detention.students.forEach(student => {
                        if (selectedStudentIds.has(student.id)) {
                            student.present = status;
                        }
                    });
                    renderStudentList();
                    renderDetentionList();
                    modals.markAttendance.modal.classList.add('hidden');
                    showNotification(`Selected students marked as ${status === 'Y' ? 'Present' : 'Absent'}.`, false);
                }
            }

            document.getElementById('bulk-mark-present').addEventListener('click', () => handleBulkAttendance('Y'));
            document.getElementById('bulk-mark-absent').addEventListener('click', () => handleBulkAttendance('N'));
            
            // Send PN Modal Logic
            document.getElementById('cancel-send-pn').addEventListener('click', () => {
                modals.sendPN.modal.classList.add('hidden');
            });

            document.getElementById('confirm-send-pn').addEventListener('click', () => {
                modals.sendPN.modal.classList.add('hidden');
                modals.sendPushNotification.modal.classList.remove('hidden');
                populatePnTemplates();
            });

            function populatePnTemplates() {
                const templateSelect = document.getElementById('message-template');
                templateSelect.innerHTML = '<option value="">Select template</option>';
                state.pnTemplates.forEach((template, index) => {
                    templateSelect.innerHTML += `<option value="${index}">${template.name}</option>`;
                });
            }

            document.getElementById('message-template').addEventListener('change', (e) => {
                const templateIndex = e.target.value;
                const messageTextarea = document.getElementById('pn-message');
                if (templateIndex !== "") {
                    messageTextarea.value = state.pnTemplates[templateIndex].message;
                } else {
                    messageTextarea.value = '';
                }
            });

            modals.sendPushNotification.form.addEventListener('submit', e => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const message = formData.get('pnMessage');
                if (!message.trim()) {
                    showNotification('Message cannot be empty.');
                    return;
                }

                const selectedCheckboxes = document.querySelectorAll('.student-row-checkbox:checked');
                const studentCount = selectedCheckboxes.length;
                // Placeholder for actual send logic
                showNotification(`Push notification sent to ${studentCount} student${studentCount > 1 ? 's' : ''}.`, false);
                
                modals.sendPushNotification.modal.classList.add('hidden');
                e.target.reset();

                // Uncheck all boxes after sending
                document.querySelectorAll('.student-row-checkbox').forEach(cb => cb.checked = false);
                document.getElementById('student-select-all').checked = false;
            });


            // --- START THE APP --- //
            initializeApp();
        });
    </script>
</body>
</html>