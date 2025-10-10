/**
 * Icons Library
 * 
 * A comprehensive collection of SVG icon components for the POS system.
 * All icons are built using React.createElement for compatibility with the vanilla React setup.
 * 
 * Features:
 * - Consistent styling with shared iconProps
 * - Scalable SVG icons with proper viewBox
 * - Stroke-based design for clean appearance
 * - Dark mode compatible
 * - Responsive sizing
 * 
 * Icon Categories:
 * - Navigation: Home, Settings, Users, etc.
 * - Actions: Add, Edit, Delete, Save, etc.
 * - Commerce: ShoppingCart, CreditCard, etc.
 * - Status: Check, X, Alert, etc.
 * - Media: Play, Pause, Volume, etc.
 * - System: Refresh, Download, Upload, etc.
 * 
 * Usage:
 * React.createElement(Icons.IconName, { size: 24, className: "custom-class" })
 * 
 * @author Rodrigo Torres
 * @version 1.0.0
 * @since 2025-01-11
 */

// public/icons.js - All icon components
const iconProps = { width: 24, height: 24, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" };

window.Icons = {
    ShoppingCart: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('circle', { key: 'circle1', cx: "9", cy: "21", r: "1" }),
        React.createElement('circle', { key: 'circle2', cx: "20", cy: "21", r: "1" }),
        React.createElement('path', { key: 'path', d: "M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" })
    ]),

    Plus: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('path', { key: 'path1', d: "M12 5v14" }),
        React.createElement('path', { key: 'path2', d: "M5 12h14" })
    ]),

    Minus: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('path', { key: 'path', d: "M5 12h14" })
    ]),

    X: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('path', { key: 'path1', d: "M18 6 6 18" }),
        React.createElement('path', { key: 'path2', d: "M6 6l12 12" })
    ]),

    Search: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('circle', { key: 'circle', cx: "11", cy: "11", r: "8" }),
        React.createElement('path', { key: 'path', d: "M21 21l-4.35-4.35" })
    ]),

    Package: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('path', { key: 'path1', d: "M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" }),
        React.createElement('path', { key: 'path2', d: "M3.29 7 12 12l8.71-5" }),
        React.createElement('path', { key: 'path3', d: "M12 22V12" })
    ]),

    BarChart3: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('path', { key: 'path1', d: "M3 3v18h18" }),
        React.createElement('path', { key: 'path2', d: "M18 17V9" }),
        React.createElement('path', { key: 'path3', d: "M13 17V5" }),
        React.createElement('path', { key: 'path4', d: "M8 17v-3" })
    ]),

    Users: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('path', { key: 'path1', d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" }),
        React.createElement('circle', { key: 'circle1', cx: "9", cy: "7", r: "4" }),
        React.createElement('path', { key: 'path2', d: "M22 21v-2a4 4 0 0 0-3-3.87" }),
        React.createElement('path', { key: 'path3', d: "M16 3.13a4 4 0 0 1 0 7.75" })
    ]),

    Award: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('circle', { key: 'circle', cx: "12", cy: "8", r: "7" }),
        React.createElement('polyline', { key: 'polyline1', points: "8.21,13.89 7,23 12,20 17,23 15.79,13.88" })
    ]),

    Edit: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('path', { key: 'path1', d: "M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" }),
        React.createElement('path', { key: 'path2', d: "M15 5l4 4" })
    ]),

    Trash2: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('path', { key: 'path1', d: "M3 6h18" }),
        React.createElement('path', { key: 'path2', d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" }),
        React.createElement('path', { key: 'path3', d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" }),
        React.createElement('line', { key: 'line1', x1: "10", x2: "10", y1: "11", y2: "17" }),
        React.createElement('line', { key: 'line2', x1: "14", x2: "14", y1: "11", y2: "17" })
    ]),

    DollarSign: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('line', { key: 'line1', x1: "12", x2: "12", y1: "1", y2: "23" }),
        React.createElement('path', { key: 'path', d: "M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" })
    ]),

    Receipt: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('path', { key: 'path1', d: "M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" }),
        React.createElement('path', { key: 'path2', d: "M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" }),
        React.createElement('path', { key: 'path3', d: "M12 18V6" })
    ]),

    Save: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('path', { key: 'path1', d: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" }),
        React.createElement('polyline', { key: 'polyline', points: "17,21 17,13 7,13 7,21" }),
        React.createElement('polyline', { key: 'polyline2', points: "7,3 7,8 15,8" })
    ]),
    Copy: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('rect', { key: 'rect1', width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2" }),
        React.createElement('path', { key: 'path1', d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" })
    ]),
    
    Grid3X3: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('rect', { key: 'rect1', width: "18", height: "18", x: "3", y: "3", rx: "2" }),
        React.createElement('path', { key: 'path1', d: "M9 3v18" }),
        React.createElement('path', { key: 'path2', d: "M15 3v18" }),
        React.createElement('path', { key: 'path3', d: "M3 9h18" }),
        React.createElement('path', { key: 'path4', d: "M3 15h18" })
    ]),
    
    List: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('line', { key: 'line1', x1: "8", x2: "21", y1: "6", y2: "6" }),
        React.createElement('line', { key: 'line2', x1: "8", x2: "21", y1: "12", y2: "12" }),
        React.createElement('line', { key: 'line3', x1: "8", x2: "21", y1: "18", y2: "18" }),
        React.createElement('line', { key: 'line4', x1: "3", x2: "3.01", y1: "6", y2: "6" }),
        React.createElement('line', { key: 'line5', x1: "3", x2: "3.01", y1: "12", y2: "12" }),
        React.createElement('line', { key: 'line6', x1: "3", x2: "3.01", y1: "18", y2: "18" })
    ]),
    
    Upload: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('path', { key: 'path1', d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }),
        React.createElement('polyline', { key: 'polyline1', points: "7,10 12,15 17,10" }),
        React.createElement('line', { key: 'line1', x1: "12", x2: "12", y1: "15", y2: "3" })
    ]),
    
    Image: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('rect', { key: 'rect', width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2" }),
        React.createElement('circle', { key: 'circle', cx: "9", cy: "9", r: "2" }),
        React.createElement('path', { key: 'path', d: "M21 15l-3.086-3.086a2 2 0 0 0-2.828 0L6 21" })
    ]),
    
    Settings: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('path', { key: 'path1', d: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" }),
        React.createElement('circle', { key: 'circle', cx: "12", cy: "12", r: "3" })
    ]),

    Filter: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('polygon', { key: 'polygon', points: "22,3 2,3 10,12.46 10,19 14,21 14,12.46" })
    ]),

    Eye: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('path', { key: 'path1', d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" }),
        React.createElement('circle', { key: 'circle', cx: "12", cy: "12", r: "3" })
    ]),

    AlertTriangle: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('path', { key: 'path1', d: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" }),
        React.createElement('line', { key: 'line1', x1: "12", x2: "12", y1: "9", y2: "13" }),
        React.createElement('line', { key: 'line2', x1: "12", x2: "12.01", y1: "17", y2: "17" })
    ]),

    Star: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('polygon', { key: 'polygon', points: "12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" })
    ]),

    TrendingUp: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('polyline', { key: 'polyline1', points: "22,7 13.5,15.5 8.5,10.5 2,17" }),
        React.createElement('polyline', { key: 'polyline2', points: "16,7 22,7 22,13" })
    ]),

    TrendingDown: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('polyline', { key: 'polyline1', points: "22,17 13.5,8.5 8.5,13.5 2,7" }),
        React.createElement('polyline', { key: 'polyline2', points: "16,17 22,17 22,11" })
    ]),

    // New icons for enhanced features
    Moon: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('path', { key: 'path', d: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" })
    ]),

    Sun: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('circle', { key: 'circle', cx: "12", cy: "12", r: "5" }),
        React.createElement('path', { key: 'path1', d: "M12 1v2" }),
        React.createElement('path', { key: 'path2', d: "M12 21v2" }),
        React.createElement('path', { key: 'path3', d: "M4.22 4.22l1.42 1.42" }),
        React.createElement('path', { key: 'path4', d: "M18.36 18.36l1.42 1.42" }),
        React.createElement('path', { key: 'path5', d: "M1 12h2" }),
        React.createElement('path', { key: 'path6', d: "M21 12h2" }),
        React.createElement('path', { key: 'path7', d: "M4.22 19.78l1.42-1.42" }),
        React.createElement('path', { key: 'path8', d: "M18.36 5.64l1.42-1.42" })
    ]),

    MapPin: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('path', { key: 'path1', d: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" }),
        React.createElement('circle', { key: 'circle', cx: "12", cy: "10", r: "3" })
    ]),

    CreditCard: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('rect', { key: 'rect', width: "20", height: "14", x: "2", y: "5", rx: "2" }),
        React.createElement('line', { key: 'line1', x1: "2", x2: "22", y1: "10", y2: "10" })
    ]),

    Percent: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('line', { key: 'line1', x1: "19", x2: "5", y1: "5", y2: "19" }),
        React.createElement('circle', { key: 'circle1', cx: "6.5", cy: "6.5", r: "2.5" }),
        React.createElement('circle', { key: 'circle2', cx: "17.5", cy: "17.5", r: "2.5" })
    ]),

    Calendar: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('rect', { key: 'rect', width: "18", height: "18", x: "3", y: "4", rx: "2", ry: "2" }),
        React.createElement('line', { key: 'line1', x1: "16", x2: "16", y1: "2", y2: "6" }),
        React.createElement('line', { key: 'line2', x1: "8", x2: "8", y1: "2", y2: "6" }),
        React.createElement('line', { key: 'line3', x1: "3", x2: "21", y1: "10", y2: "10" })
    ]),

    Clock: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('circle', { key: 'circle', cx: "12", cy: "12", r: "10" }),
        React.createElement('polyline', { key: 'polyline', points: "12,6 12,12 16,14" })
    ]),

    CheckCircle: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('path', { key: 'path1', d: "M22 11.08V12a10 10 0 1 1-5.93-9.14" }),
        React.createElement('polyline', { key: 'polyline', points: "22,4 12,14.01 9,11.01" })
    ]),

    AlertCircle: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('circle', { key: 'circle', cx: "12", cy: "12", r: "10" }),
        React.createElement('line', { key: 'line1', x1: "12", x2: "12", y1: "8", y2: "12" }),
        React.createElement('line', { key: 'line2', x1: "12", x2: "12.01", y1: "16", y2: "16" })
    ]),

    Tool: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('path', { key: 'path1', d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" })
    ]),

    Wrench: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('path', { key: 'path', d: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" })
    ]),

    User: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('path', { key: 'path1', d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" }),
        React.createElement('circle', { key: 'circle', cx: "12", cy: "7", r: "4" })
    ]),

    FileText: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('path', { key: 'path1', d: "M14,2 L14,8 L20,8 M14,2 L20,8 L20,20 C20,21.1 19.1,22 18,22 L6,22 C4.9,22 4,21.1 4,20 L4,4 C4,2.9 4.9,2 6,2 L14,2 Z" }),
        React.createElement('line', { key: 'line1', x1: "16", x2: "8", y1: "13", y2: "13" }),
        React.createElement('line', { key: 'line2', x1: "16", x2: "8", y1: "17", y2: "17" }),
        React.createElement('line', { key: 'line3', x1: "10", x2: "8", y1: "9", y2: "9" })
    ]),

    Phone: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('path', { key: 'path', d: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" })
    ]),

    Mail: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('path', { key: 'path1', d: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" }),
        React.createElement('polyline', { key: 'polyline', points: "22,6 12,13 2,6" })
    ]),

    Building: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('path', { key: 'path1', d: "M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" }),
        React.createElement('path', { key: 'path2', d: "M6 12H4a2 2 0 0 0-2 2v8h4" }),
        React.createElement('path', { key: 'path3', d: "M18 9h2a2 2 0 0 1 2 2v11h-4" }),
        React.createElement('path', { key: 'path4', d: "M10 6h4" }),
        React.createElement('path', { key: 'path5', d: "M10 10h4" }),
        React.createElement('path', { key: 'path6', d: "M10 14h4" }),
        React.createElement('path', { key: 'path7', d: "M10 18h4" })
    ]),

    Tag: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('path', { key: 'path1', d: "M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42l-8.704-8.704Z" }),
        React.createElement('circle', { key: 'circle', cx: "7.5", cy: "7.5", r: ".5" })
    ]),

    Hash: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('line', { key: 'line1', x1: "4", x2: "20", y1: "9", y2: "9" }),
        React.createElement('line', { key: 'line2', x1: "4", x2: "20", y1: "15", y2: "15" }),
        React.createElement('line', { key: 'line3', x1: "10", x2: "8", y1: "3", y2: "21" }),
        React.createElement('line', { key: 'line4', x1: "16", x2: "14", y1: "3", y2: "21" })
    ]),

    Database: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('ellipse', { key: 'ellipse1', cx: "12", cy: "5", rx: "9", ry: "3" }),
        React.createElement('path', { key: 'path1', d: "M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" }),
        React.createElement('path', { key: 'path2', d: "M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" })
    ]),

    Key: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('circle', { key: 'circle', cx: "7.5", cy: "15.5", r: "5.5" }),
        React.createElement('path', { key: 'path', d: "m21 2-9.6 9.6" }),
        React.createElement('path', { key: 'path2', d: "M15.5 7.5l6-6" })
    ]),

    Users: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('path', { key: 'path1', d: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" }),
        React.createElement('circle', { key: 'circle1', cx: "9", cy: "7", r: "4" }),
        React.createElement('path', { key: 'path2', d: "M23 21v-2a4 4 0 0 0-3-3.87" }),
        React.createElement('path', { key: 'path3', d: "M16 3.13a4 4 0 0 1 0 7.75" })
    ]),

    LogOut: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('path', { key: 'path1', d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" }),
        React.createElement('polyline', { key: 'polyline', points: "16,17 21,12 16,7" }),
        React.createElement('line', { key: 'line', x1: "21", x2: "9", y1: "12", y2: "12" })
    ]),

    RefreshCw: (props) => React.createElement('svg', { ...iconProps, ...props }, [
        React.createElement('path', { key: 'path1', d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" }),
        React.createElement('path', { key: 'path2', d: "M21 3v5h-5" }),
        React.createElement('path', { key: 'path3', d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" }),
        React.createElement('path', { key: 'path4', d: "M3 21v-5h5" })
    ])
};
