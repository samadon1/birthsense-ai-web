"use client"

import { useState, useRef, useEffect } from "react"
import {
  Send,
  Loader2,
  X,
  Stethoscope,
  ChevronDown,
  ChevronUp,
  Info,
  BarChart2,
  FileText,
  Settings,
  User,
  LogOut,
  Brain,
  Zap,
  Maximize2,
  Layers,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Lightbulb,
  Microscope,
  Wand2,
  ChevronLeft,
  ChevronRight,
  Camera,
  Video,
  VideoOff,
  Plus // Added for mobile options button
} from "lucide-react"

// Simulating the nifti-reader-js import (not used anymore for direct uploads)
// const niftiReader = { ... } // Removed as NIfTI parsing is now backend

function App() {
  const [messages, setMessages] = useState([
    {
      role: "system",
      content:
        "Welcome to BirthSense AI. Upload an image using the buttons below or select a demo image. Then use commands like `/detect`, `/segment`, or `/ask`.",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentImage, setCurrentImage] = useState(null) // Will store the File object
  const [showSidebar, setShowSidebar] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeTab, setActiveTab] = useState("chat")
  const [processingProgress, setProcessingProgress] = useState(0) // Keep for potential future use
  const [processingStage, setProcessingStage] = useState("")
  const [previewImage, setPreviewImage] = useState(null) // URL or data URL for display only (small preview)
  const [theme, setTheme] = useState("light")
  const [showCommandSuggestions, setShowCommandSuggestions] = useState(false)
  const [showFileBrowser, setShowFileBrowser] = useState(false) // For the demo image modal
  const [ultrasoundAnalysisResult, setUltrasoundAnalysisResult] = useState(null);
  // Removed mriSegmentationResultUrl as we now use inline previews
  const [apiError, setApiError] = useState(null);

  // New state variables for webcam
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [videoStream, setVideoStream] = useState(null);
  const [latestDetectionResult, setLatestDetectionResult] = useState(null);
  const [webcamError, setWebcamError] = useState(null);
  const [lastAnalysisTime, setLastAnalysisTime] = useState(0);

  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null) // Ref for the hidden file input
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)

  // New refs for webcam
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);

  const BACKEND_URL = "https://9ba5-2c0f-2a80-7b5-a210-fd46-bd6d-af34-fe13.ngrok-free.app"; // Define backend URL constant

  // Sample patient data for demo - De-identified
  const patientData = {
    name: "Jane Doe", // Generic Name
    age: 30,          // Generic Age
    gestationalAge: "24 weeks", // Simplified GA
    lastScan: "YYYY-MM-DD", // Placeholder Date
    riskFactors: ["Previous C-Section", "Advanced Maternal Age"], // Generic Factors
    notes: "Routine follow-up scan scheduled.", // Generic Note
    mrn: "MRN1234567", // Placeholder MRN
    dob: "YYYY-MM-DD" // Placeholder DOB
  }

  // Sample analytics data for demo
  const analyticsData = {
    scansThisMonth: 28,
    standardPlanes: 22,
    nonStandardPlanes: 6,
    averageQualityScore: 83.4,
    mostCommonIssue: "Suboptimal nasal bone visualization",
    weeklyTrend: [65, 72, 78, 83],
    recentScans: [
      { date: "2023-11-20", quality: 87, standard: true },
      { date: "2023-11-18", quality: 92, standard: true },
      { date: "2023-11-15", quality: 76, standard: true },
      { date: "2023-11-12", quality: 64, standard: false },
    ],
  }

  // Command suggestions
  const commandSuggestions = [
    { command: "/detect", description: "Analyze ultrasound image" },
    { command: "/segment", description: "Segment MRI image (NIfTI)" },
    { command: "/ask", description: "Ask questions about the image" },
  ]

  const [showMobileOptions, setShowMobileOptions] = useState(false); // State for mobile options menu
  const [isMobile, setIsMobile] = useState(false); // State to track mobile view
  const mobileOptionsRef = useRef(null); // Ref for mobile options dropdown

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Close dropdown when clicking outside
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  // Cleanup blob URL or potentially other data URLs on component unmount or when previewImage changes
   useEffect(() => {
    let currentPreview = previewImage;
    return () => {
        // Only revoke if it's a blob URL
        if (currentPreview && currentPreview.startsWith('blob:')) {
            URL.revokeObjectURL(currentPreview);
        }
    };
   }, [previewImage]);

    // Cleanup for MRI segmentation result is no longer needed as it's inline base64

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async () => {
    if (!input.trim()) {
       // Allow sending command even without text input if an image is present
       if (!currentImage || !input.startsWith('/')) {
         console.log("No input or command without image.");
         return;
       }
    }

    const userMessageContent = input || (currentImage ? `Processing ${currentImage.name}...` : "Empty message");

    // User message no longer includes the image directly,
    // it's handled by the preview below input and system messages
    const userMessage = {
      role: "user",
      content: userMessageContent,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("") // Clear input after sending
    setIsLoading(true)
    setProcessingProgress(0)
    setProcessingStage("")
    setShowCommandSuggestions(false)
    setApiError(null); // Clear previous errors
    setUltrasoundAnalysisResult(null); // Clear previous results


    // --- Process commands ---
    const command = input.trim(); // Use trimmed input for command check
    if (command.startsWith("/detect")) {
      await processDetectCommand(command)
    } else if (command.startsWith("/segment")) {
      await processSegmentCommand(command)
    } else if (command.startsWith("/ask")) {
      await processAskCommand(command) // Keep existing ask logic for now
    } else if (currentImage && !command.startsWith("/")) {
        // If there's an image but no specific command, require command.
         setTimeout(() => {
            setMessages((prev) => [
            ...prev,
            {
                role: "assistant",
                content: "Please specify a command like `/detect` or `/segment` when an image is uploaded.",
                timestamp: new Date().toISOString(),
            },
            ])
            setIsLoading(false)
         }, 500);
    }
     else {
      // Default response if no relevant command/image combo
      setTimeout(() => {
        const responseMessage = {
          role: "assistant",
          content: "Please upload an image and use a command like `/detect`, `/segment`, or `/ask [your question]`.",
          timestamp: new Date().toISOString(),
        }

        setMessages((prev) => [...prev, responseMessage])
        setIsLoading(false)
      }, 500)
    }
  }

  const processDetectCommand = async (command) => {
    if (!currentImage || !(currentImage instanceof File)) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Error: Please upload or select a valid ultrasound image file first before using /detect.",
          timestamp: new Date().toISOString(),
          isError: true,
        },
      ])
      setIsLoading(false)
      return
    }

    // Basic check for image type (can be refined)
    if (!currentImage.type.startsWith('image/')) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
            content: `Error: /detect expects an image file (jpg, png, etc.), but received type ${currentImage.type || 'unknown'}. Please upload a suitable image.`,
          timestamp: new Date().toISOString(),
            isError: true,
        },
      ])
      setIsLoading(false)
      return
    }


    setIsLoading(true);
    setProcessingStage("Sending image to backend...");
    setApiError(null);
    setUltrasoundAnalysisResult(null); // Clear previous results

    const formData = new FormData();
    formData.append('file', currentImage, currentImage.name); // Ensure filename is included

    try {
        setProcessingStage("Analyzing ultrasound...");
        const response = await fetch(`${BACKEND_URL}/analyze_ultrasound/`, { // Use BACKEND_URL
            method: 'POST',
            body: formData,
        });

        setProcessingStage("Processing results...");

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: response.statusText }));
            throw new Error(`API Error (${response.status}): ${errorData.detail || 'Failed to get analysis'}`);
        }

        const result = await response.json();
        console.log("[processDetectCommand] Result from backend:", result);
        if (result.annotated_image_base64 && result.annotated_image_base64.length > 100) {
            console.log("[processDetectCommand] Base64 string received (length: " + result.annotated_image_base64.length + ")");
        } else {
            console.log("[processDetectCommand] Base64 string NOT received or too short from backend.");
        }
        // setUltrasoundAnalysisResult(result); // Store result - Not used directly anymore?

    const responseMessage = {
      role: "assistant",
            content: "Ultrasound analysis complete.", // Keep text minimal
            timestamp: new Date().toISOString(),
            analysisData: result // Pass the full result including base64
        };
        setMessages((prev) => [...prev, responseMessage]);


    } catch (error) {
        console.error("Error calling /analyze_ultrasound:", error);
        setApiError(error.message);
        const errorMessage = {
            role: "assistant",
            content: `Error analyzing ultrasound: ${error.message}`,
      timestamp: new Date().toISOString(),
            isError: true,
        };
        setMessages((prev) => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
        setProcessingProgress(0); // Reset progress
        setProcessingStage("");
    }
  }

  const processSegmentCommand = async (command) => {
     if (!currentImage || !(currentImage instanceof File)) {
        // ... (error handling for no file) ...
      return
    }

    // Basic check for NIfTI file type
    const fileName = currentImage.name.toLowerCase();
    if (!fileName.endsWith('.nii') && !fileName.endsWith('.nii.gz')) {
        // ... (error handling for wrong file type) ...
        return
    }

    setIsLoading(true);
    setProcessingStage("Sending MRI data to backend...");
    setApiError(null);

    const formData = new FormData();
    formData.append('file', currentImage, currentImage.name);

    try {
        setProcessingStage("Segmenting MRI structures (this may take a while)...");
        const response = await fetch(`${BACKEND_URL}/segment_mri/`, { // Use BACKEND_URL
            method: 'POST',
            body: formData,
        });

        setProcessingStage("Processing segmentation result...");

        if (!response.ok) {
             // Get error details from the response body
             const errorData = await response.json().catch(() => ({ detail: response.statusText }));
             const errorDetail = errorData.detail || 'Failed to segment MRI'; // Define errorDetail here
             throw new Error(`API Error (${response.status}): ${errorDetail}`); // Now errorDetail is defined
        }

        // Expect JSON response with previews and legend
        const result = await response.json();

        // *** UPDATED CHECK ***
        // Check if we received the 'previews' object and at least the 'axial' preview
        if (!result || !result.previews || !result.previews.axial) {
             console.error("Invalid segmentation response structure:", result); // Log for debugging
             throw new Error("Received invalid segmentation preview data structure from backend.");
        }

        // *** UPDATED MESSAGE STRUCTURE ***
    const responseMessage = {
      role: "assistant",
            content: result.message || "MRI Segmentation Complete.", // Use backend message if available
      timestamp: new Date().toISOString(),
            previews: result.previews, // Store the dictionary of previews
            legend: result.legend      // Store the legend
        };
        setMessages((prev) => [...prev, responseMessage]);

    } catch (error) {
        console.error("Error calling /segment_mri:", error);
        setApiError(error.message);
        const errorMessage = {
            role: "assistant",
            content: `Error segmenting MRI: ${error.message}`,
            timestamp: new Date().toISOString(),
            isError: true,
        };
        setMessages((prev) => [...prev, errorMessage]);
    } finally {
        setIsLoading(false);
        setProcessingProgress(0); // Reset progress
        setProcessingStage("");
    }
  }

  const processAskCommand = async (command) => {
    if (!currentImage) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Please upload or select an image first before using the /ask command.",
          timestamp: new Date().toISOString(),
        },
      ])
      setIsLoading(false)
      return
    }

    const question = command.replace("/ask", "").trim()

    // Example responses based on the question (Still Hardcoded - Needs Backend Integration)
    let response = "I'm ready to answer questions about the image, but this feature is currently using placeholder responses. Ask about 'missing', 'normal', 'quality', or 'gestational age' for examples."

    if (question.toLowerCase().includes("missing")) {
      response =
        "Based on my analysis, there appears to be suboptimal visualization of the nasal bone in this ultrasound. The fetal profile is slightly off-angle, which makes it difficult to properly assess the nasal bone. For a standard plane, I would recommend adjusting the probe angle to better visualize the nasal bone and facial profile."
    } else if (question.toLowerCase().includes("abnormal") || question.toLowerCase().includes("normal")) {
      response =
        "The image shows normal development of the thalami and midbrain structures. The nuchal translucency (NT) measurement appears to be within normal range, though I would recommend taking multiple measurements for accuracy. The intracranial translucency (IT) is also visible, which is a good sign for neural tube development."
    } else if (question.toLowerCase().includes("quality")) {
      response =
        "The image quality is good, with clear visualization of the thalami (0.85 confidence) and midbrain (0.86 confidence). The nuchal translucency (NT) is visible with 0.77 confidence. To improve, I would suggest slight adjustments to capture the nasal bone and palate more clearly, which would make this a perfect standard plane for NT assessment."
    } else if (question.toLowerCase().includes("gestational age")) {
      response =
        "Based on the biometric measurements visible in this 2D sagittal-view ultrasound, I estimate the gestational age to be approximately 23-24 weeks. The head circumference, biparietal diameter, and visible anatomical structures are consistent with this estimation. The thalami and midbrain structures are well-developed, and the nuchal translucency measurement is no longer relevant at this stage. For a more precise estimation, I would recommend additional measurements including femur length and abdominal circumference."
    }

    // Add a small delay to simulate thinking
    await new Promise(resolve => setTimeout(resolve, 500));

    const responseMessage = {
      role: "assistant",
      content: response,
      timestamp: new Date().toISOString(),
      references:
        question.toLowerCase().includes("missing") ||
        question.toLowerCase().includes("abnormal") ||
        question.toLowerCase().includes("gestational age")
          ? [
              "ISUOG Practice Guidelines: performance of first-trimester fetal ultrasound scan",
              "Fetal Medicine Foundation: The 11-13 weeks scan",
            ]
          : null,
    }

    setMessages((prev) => [...prev, responseMessage])
    setIsLoading(false)
    setProcessingProgress(0)
    setProcessingStage("")
  }


  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    } else if (e.key === "/" && input === "") {
      setShowCommandSuggestions(true)
    } else if (e.key === "Escape") {
      setShowCommandSuggestions(false)
    }
  }

  // Handles file selection from the native file input dialog
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Revoke previous preview blob URL if it exists
      if (previewImage && previewImage.startsWith('blob:')) {
          URL.revokeObjectURL(previewImage);
      }
      // Always clear preview state when a new file is loaded
      setPreviewImage(null);

      setCurrentImage(file); // Store the actual File object
      setApiError(null); // Clear errors on new upload
      setUltrasoundAnalysisResult(null); // Clear analysis results

      const isNifti = file.name.toLowerCase().endsWith(".nii") || file.name.toLowerCase().endsWith(".nii.gz");
      let newPreviewDataUrl = null;

      // --- NIfTI Preview Handling (SKIP) ---
      if (isNifti) {
          console.log("NIfTI file detected, skipping backend preview generation.");
          // We set newPreviewDataUrl to null intentionally
          newPreviewDataUrl = null;
      } else {
          // --- Standard Image Preview Handling (use blob URL) ---
          newPreviewDataUrl = URL.createObjectURL(file);
      }

      // --- Update State and UI ---
      setPreviewImage(newPreviewDataUrl); // Set preview (null for NIfTI, blob URL for others)
      setInput(isNifti ? "/segment " : "/detect "); // Suggest command
      setShowCommandSuggestions(true);
      inputRef.current?.focus(); // Focus input

       // Add system message confirming upload/selection
       const systemMessage = {
          role: "system",
          content: `File "${file.name}" loaded. ${isNifti ? 'Preview skipped. ' : ''}Use ${isNifti ? '/segment' : '/detect'} or type command.`,
          timestamp: new Date().toISOString(),
       };
       setMessages((prev) => [...prev, systemMessage]);
    }
    // Reset file input value so the same file can be selected again if needed
    if(e.target) e.target.value = null;
  }

  // Opens the demo image browser modal
  const handleButtonClick = () => {
    setShowFileBrowser(true)
  }

  const handleClearImage = () => {
    setCurrentImage(null)
    if (previewImage && previewImage.startsWith('blob:')) {
        URL.revokeObjectURL(previewImage);
    }
    setPreviewImage(null) // Also clear preview (blob or base64 data URL)
    setUltrasoundAnalysisResult(null); // Clear analysis results
    setApiError(null);
    // Maybe add a system message?
     setMessages((prev) => [
        ...prev,
        { role: "system", content: "Current image cleared.", timestamp: new Date().toISOString()}
     ]);
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const handleCommandClick = (command) => {
    setInput(command + " ")
    setShowCommandSuggestions(false)
    inputRef.current?.focus()
  }

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light")
    document.documentElement.classList.toggle("dark", theme !== "light")
  }

  // Apply theme class on initial render
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [])

  // Handles selection from the demo image browser modal
  const handleSelectImageFromBrowser = async (imageUrl, isMri) => {
      console.log("[handleSelectImageFromBrowser] Called with:", imageUrl, "isMri:", isMri);
      setShowFileBrowser(false); // Close modal immediately

      setIsLoading(true); // Show loading indicator
      setProcessingStage(`Loading demo ${isMri ? 'MRI' : 'ultrasound'}...`);
      setApiError(null);
      setUltrasoundAnalysisResult(null);
      // Clear previous preview
      if (previewImage && previewImage.startsWith('blob:')) {
          URL.revokeObjectURL(previewImage);
      }
      setPreviewImage(null); // Always clear preview state

      let newPreviewDataUrl = null;
      let loadedFile = null;

      try {
          // Fetch the demo file blob
          const fetchUrl = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
          const response = await fetch(fetchUrl);
          if (!response.ok) {
              throw new Error(`Failed to fetch demo image: ${response.status} ${response.statusText}`);
          }
          const blob = await response.blob();
          const filename = imageUrl.substring(imageUrl.lastIndexOf('/') + 1) || (isMri ? 'demo_mri.nii.gz' : 'demo_ultrasound.webp');
          const fileType = blob.type || (isMri ? 'application/gzip' : 'application/octet-stream'); // Default for NIfTI if type missing
          loadedFile = new File([blob], filename, { type: fileType });
          setCurrentImage(loadedFile); // Set the file object

          // --- Generate Preview (SKIP FOR MRI) ---
          if (isMri) {
              console.log("Demo MRI selected, skipping backend preview generation.");
              newPreviewDataUrl = null; // No preview for demo MRI
          } else {
              // Create blob URL for standard images
              newPreviewDataUrl = URL.createObjectURL(blob);
          }

          // --- Update State and UI ---
          setPreviewImage(newPreviewDataUrl); // Set preview (null for MRI, blob URL for others)
          setInput(isMri ? "/segment " : "/detect ");
          setShowCommandSuggestions(true);
          inputRef.current?.focus();

          // Add system message
          const systemMessage = {
              role: "system",
              content: `Demo file "${loadedFile.name}" loaded. ${isMri ? 'Preview skipped. ' : ''}Use ${isMri ? '/segment' : '/detect'} or type command.`,
              timestamp: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, systemMessage]);

      } catch (error) {
          console.error("Error loading demo image:", error);
          setApiError(`Failed to load demo image: ${error.message}`);
          setMessages((prev) => [
              ...prev,
              {
                  role: "assistant",
                  content: `Error loading demo image "${imageUrl}": ${error.message}. Check file exists & backend is running.`,
                  timestamp: new Date().toISOString(),
                  isError: true,
              },
          ]);
          // Clear potentially partially set state
          setCurrentImage(null);
          setPreviewImage(null);
      } finally {
           setIsLoading(false); // Hide loading indicator
           setProcessingStage("");
      }
  }

  // --- Effect for Screen Size Detection ---
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768; // Tailwind 'md' breakpoint
      setIsMobile(mobile);
      // Set initial sidebar state based on screen size
      setShowSidebar(!mobile);
    };

    checkScreenSize(); // Check on initial load
    window.addEventListener("resize", checkScreenSize);

    // Cleanup listener on component unmount
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []); // Empty dependency array ensures this runs only once on mount and cleanup on unmount

  // --- Close dropdowns when clicking outside ---
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
       // Close mobile options dropdown
      if (mobileOptionsRef.current && !mobileOptionsRef.current.contains(event.target) && !event.target.closest('.mobile-options-trigger')) {
         setShowMobileOptions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []); // Added mobileOptionsRef check

  // Chat Message Component
  function ChatMessage({ message, index }) {
    const isUser = message.role === "user"
    const isSystem = message.role === "system"
    const [expanded, setExpanded] = useState(true) // Keep expanded by default

    // --- State for Segmentation View ---
    const [currentSegView, setCurrentSegView] = useState('axial'); // Default view

    // Determine if the message contains analysis results or previews to show
    const hasAnalysisData = message.analysisData;
    const annotatedImageBase64 = message.analysisData?.annotated_image_base64;
    const hasSegmentationPreviews = message.previews && Object.keys(message.previews).length > 0; // Check if previews object exists and has keys
    const segmentationLegend = message.legend; // Get legend data

    // Get the base64 string for the currently selected segmentation view
    const currentSegmentationPreviewBase64 = hasSegmentationPreviews ? message.previews[currentSegView] : null;

    return (
      <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"} ${isSystem && "justify-center px-4"}`}>
        <div
          className={`relative rounded-lg p-4 shadow-sm ${ /* Background/Text Colors */
            isUser
              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
              : isSystem
                ? "bg-gray-100 text-gray-600 text-center text-sm dark:bg-gray-700 dark:text-gray-300 w-full max-w-2xl" // Wider system messages
                : "bg-white border border-gray-200 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
          } ${ /* Width Adjustment */
             // Adjust width if any image/preview exists
             message.image || annotatedImageBase64 || hasSegmentationPreviews ? "max-w-md" : "max-w-[80%]" // Use hasSegmentationPreviews
          } ${ /* Error Styling */
             message.isError ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-700 dark:text-red-300" : ""
          } transition-all duration-300 hover:shadow-md`}
        >
           {/* Timestamp and Role Icon */}
          <div className="flex justify-between items-start mb-1">
            <div className="flex items-center">
              {!isSystem && (
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${isUser ? "bg-blue-700" : message.isError ? "bg-red-100 dark:bg-red-900" : "bg-blue-100 dark:bg-blue-900"}`}
                >
                  {isUser ? (
                    <User className="h-3 w-3 text-white" />
                  ) : message.isError ? (
                     <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  ) : (
                    // Use Brain icon for segmentation results if previews exist
                    hasSegmentationPreviews ? <Brain className="h-3 w-3 text-blue-700 dark:text-blue-400" /> :
                    <Stethoscope className="h-3 w-3 text-blue-700 dark:text-blue-400" />
                  )}
                </div>
              )}
              <span className="text-xs opacity-70">{message.timestamp && formatTimestamp(message.timestamp)}</span>
            </div>
            {/* Expand/Collapse Button - Removed */}
          </div>

          {/* Main Content (Text) */}
          {message.content && (typeof message.content === 'string' ? (
             <p className="whitespace-pre-wrap">{message.content}</p>
           ) : (
             // Render JSX content directly if provided
             <div className="prose prose-sm dark:prose-invert max-w-none">{message.content}</div>
           )
          )}

         {/* Annotated Ultrasound Image from Assistant */}
         {annotatedImageBase64 && !isUser && (
             <div className="mt-3 border border-gray-300 dark:border-gray-600 rounded overflow-hidden shadow-sm">
                 <img
                    src={`data:image/jpeg;base64,${annotatedImageBase64}`}
                    alt="Annotated Ultrasound Analysis"
                    className="max-w-full h-auto object-contain block" // Use block display
                 />
              </div>
          )}

         {/* Segmentation Preview Images & Controls from Assistant */}
         {hasSegmentationPreviews && !isUser && (
            <div className="mt-3 border border-gray-300 dark:border-gray-600 rounded overflow-hidden shadow-sm">
                 {/* Image Display - Source depends on currentSegView */}
                 {currentSegmentationPreviewBase64 ? (
                    <img
                        src={`data:image/png;base64,${currentSegmentationPreviewBase64}`}
                        alt={`MRI Segmentation Preview (${currentSegView})`}
                        className="max-w-full h-auto object-contain block bg-gray-200 dark:bg-gray-700" // Added background
                    />
                 ) : (
                    <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700">
                        Preview for {currentSegView} view not available.
                    </div>
                 )}
                 {/* View Buttons */}
                 <div className="flex justify-center gap-1 p-1 bg-gray-100 dark:bg-gray-900 border-t border-gray-300 dark:border-gray-600">
                    {['axial', 'sagittal', 'coronal'].map((view) => (
                         message.previews[view] && ( // Only show button if preview exists for that view
                            <button
                                key={view}
                                onClick={() => setCurrentSegView(view)}
                                className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                                    currentSegView === view
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                            >
                                {view.charAt(0).toUpperCase() + view.slice(1)} {/* Capitalize */}
                            </button>
                         )
                    ))}
                 </div>
                 {/* Segmentation Legend */}
                 {segmentationLegend && Object.keys(segmentationLegend).length > 0 && (
                    <div className="p-3 border-t border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50">
                        <h4 className="text-xs font-semibold mb-2 text-gray-700 dark:text-gray-300">Legend:</h4>
                        <div className="flex flex-wrap gap-x-3 gap-y-1">
                            {Object.entries(segmentationLegend).map(([name, color]) => (
                                <div key={name} className="flex items-center">
                                    <span
                                        className="w-3 h-3 rounded-sm mr-1.5 inline-block border border-gray-400 dark:border-gray-500"
                                        style={{ backgroundColor: color }} // Use direct RGBA string
                                    ></span>
                                    <span className="text-xs text-gray-600 dark:text-gray-400">{name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                 )}
            </div>
          )}

         {/* Display Ultrasound Analysis Details - Render details if analysisData exists */}
         {hasAnalysisData && !isUser && (
            <div className={`${annotatedImageBase64 ? 'mt-3' : 'mt-2'}`}> {/* Add margin top */}
                {/* Ultrasound Specific Results */}
                <div className="space-y-3">
                    {/* Plane type and score */}
                    <div
                        className={`p-3 rounded-md ${
                            message.analysisData.plane_type === 'Standard'
                      ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900"
                      : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900"
                  }`}
                >
                  <div className="font-semibold flex items-center">
                            {message.analysisData.plane_type === 'Standard' ? (
                            <><CheckCircle2 className="h-4 w-4 mr-1" /><span>Standard Plane</span></>
                            ) : (
                            <><XCircle className="h-4 w-4 mr-1" /><span>Non-Standard Plane</span></>
                    )}
                  </div>
                  <div className="text-sm mt-1">
                    <div className="flex items-center">
                      <span>Quality Score:</span>
                      <div className="ml-2 w-24 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div
                                        className={`h-full ${message.analysisData.plane_type === 'Standard' ? "bg-green-500" : "bg-red-500"}`}
                                        style={{ width: `${message.analysisData.quality_score}%` }}
                        />
                      </div>
                                <span className="ml-2">{message.analysisData.quality_score.toFixed(1)}/100</span>
                    </div>
                  </div>
                </div>

                    {/* Detected structures */}
                    <div>
                        <h4 className="font-medium text-sm flex items-center mb-1">
                    <Layers className="h-4 w-4 mr-1 text-blue-600 dark:text-blue-400" />
                    <span>Detected Structures:</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                            {(message.analysisData.detected_structures?.length > 0) ? (
                                message.analysisData.detected_structures.map((structure, index) => (
                      <span
                        key={index}
                                    className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                      >
                                    {structure}
                      </span>
                                ))
                            ) : (
                                <span className="text-xs text-gray-500 dark:text-gray-400">No structures detected above threshold.</span>
                            )}
                  </div>
                </div>

                    {/* Guidance */}
                    <div className="p-3 bg-blue-50 rounded-md border border-blue-100 dark:bg-blue-900/20 dark:border-blue-900">
                  <h4 className="font-medium text-sm text-blue-800 dark:text-blue-300 mb-1 flex items-center">
                    <Lightbulb className="h-4 w-4 mr-1 text-blue-700 dark:text-blue-400" />
                            <span>Guidance:</span>
                  </h4>
                  <ul className="list-disc pl-5 text-xs text-blue-700 dark:text-blue-300 space-y-1">
                            {message.analysisData.guidance?.length > 0 ? (
                                 message.analysisData.guidance.map((rec, index) => (
                      <li key={index}>{rec}</li>
                                ))
                            ) : (
                                <li>No specific guidance provided.</li>
                            )}
                  </ul>
                </div>
                  </div>
                </div>
              )}

           {/* Segmentation Specific Results are now just the preview image above */}

           {/* References (from /ask command) */}
              {message.references && (
                <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                  <div className="font-medium mb-1 flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    <span>References:</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5">
                    {message.references.map((ref, index) => (
                      <li key={index}>{ref}</li>
                    ))}
                  </ul>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Webcam functions
  const startAnalysisLoop = () => {

    // Helper function to draw overlays based on detection results
    const drawOverlays = (ctx, videoElement, result) => {
        if (!ctx || !videoElement || videoElement.videoWidth <= 0 || videoElement.videoHeight <= 0) return; // Ensure context and video dimensions are valid

        const canvas = ctx.canvas;
        // Ensure canvas dimensions match the video display size
        canvas.width = videoElement.clientWidth;
        canvas.height = videoElement.clientHeight;
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear previous drawings

        // Only proceed if we have valid results with boxes
        if (!result || !result.boxes || result.boxes.length === 0) {
            return; // No boxes to draw
        }

        // --- Calculate Scaling and Offsets respecting object-fit: contain ---
        const videoWidth = videoElement.videoWidth;
        const videoHeight = videoElement.videoHeight;
        const containerWidth = videoElement.clientWidth;
        const containerHeight = videoElement.clientHeight;

        // *** Add Detailed Logging Here ***
        console.log(`[Draw Overlays - Debug] Video Intrinsic: ${videoWidth}x${videoHeight}`);
        console.log(`[Draw Overlays - Debug] Container Display: ${containerWidth}x${containerHeight}`);

        const videoRatio = videoWidth / videoHeight;
        const containerRatio = containerWidth / containerHeight;

        console.log(`[Draw Overlays - Debug] Ratios - Video: ${videoRatio.toFixed(3)}, Container: ${containerRatio.toFixed(3)}`);


        let scale = 1;
        let offsetX = 0;
        let offsetY = 0;

        if (containerRatio > videoRatio) { // Letterboxing (video height fits container height)
            scale = containerHeight / videoHeight;
            const renderedWidth = videoWidth * scale;
            offsetX = (containerWidth - renderedWidth) / 2;
            console.log(`[Draw Overlays - Debug] Mode: Letterbox`);
        } else { // Pillarboxing (video width fits container width)
            scale = containerWidth / videoWidth;
            const renderedHeight = videoHeight * scale;
            offsetY = (containerHeight - renderedHeight) / 2;
            console.log(`[Draw Overlays - Debug] Mode: Pillarbox`);
        }
        // --- End Scaling Calculation ---


        console.log(`[Draw Overlays - Debug] Calculated - Scale: ${scale.toFixed(3)}, OffsetX: ${offsetX.toFixed(3)}, OffsetY: ${offsetY.toFixed(3)}`); // Added log with more precision

        ctx.strokeStyle = '#00FF00'; // Green boxes
        ctx.lineWidth = 2;
        ctx.font = '12px Arial';
        ctx.fillStyle = '#00FF00';

        result.boxes.forEach(boxData => {
            // console.log("[Draw Overlays] Box data:", boxData); // Keep commented for now unless needed
            if (!boxData || !boxData.box || boxData.box.length !== 4) {
                console.warn("[Draw Overlays] Invalid box data received:", boxData);
                return; // Skip invalid box data
            }
            const [x1, y1, x2, y2] = boxData.box;
            const label = boxData.label || 'Unknown'; // Default label
            const conf = boxData.conf !== undefined ? boxData.conf : 0; // Default confidence

            // Apply scaling AND offset to coordinates and dimensions
            const scaledX1 = (x1 * scale) + offsetX;
            const scaledY1 = (y1 * scale) + offsetY;
            const scaledW = (x2 - x1) * scale;
            const scaledH = (y2 - y1) * scale;

            // *** Add Box Coordinate Logging ***
            // console.log(`[Draw Overlays - Debug] Box '${label}': Orig=[${x1.toFixed(1)},${y1.toFixed(1)},${x2.toFixed(1)},${y2.toFixed(1)}] Scaled=[${scaledX1.toFixed(1)},${scaledY1.toFixed(1)},${scaledW.toFixed(1)},${scaledH.toFixed(1)}]`); // Uncomment if needed

            // Draw rectangle
            ctx.strokeRect(scaledX1, scaledY1, scaledW, scaledH);

            // Draw label and confidence (adjust position logic if needed)
            const labelText = `${label} (${conf.toFixed(2)})`;
            const labelYPosition = scaledY1 > 15 ? scaledY1 - 5 : scaledY1 + 12; // Simple position logic
            ctx.fillText(labelText, scaledX1, labelYPosition);
        });
    };


    const analyzeFrame = async () => {
      // Check if camera is active and video is ready
      if (!isCameraActive || !videoRef.current || videoRef.current.readyState < 2) {
        if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
         // Ensure canvas is cleared when stopping
         const overlayCanvas = canvasRef.current;
         if(overlayCanvas) {
             const overlayCtx = overlayCanvas.getContext('2d');
             if(overlayCtx) overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
         }
        return;
      }

      const video = videoRef.current;
      const now = Date.now();
      const elapsed = now - lastAnalysisTime;
      const analysisInterval = 500; // ms - Analyze roughly every 0.5 seconds
      let fetchedResultThisFrame = null; // Store result fetched in this specific frame

      // --- Fetch analysis if interval has passed ---
      if (elapsed > analysisInterval) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = video.videoWidth;
        tempCanvas.height = video.videoHeight;
        const ctx = tempCanvas.getContext('2d');
        ctx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);

        // Using await with a Promise wrapper around toBlob to ensure fetch completes
        await new Promise((resolve) => {
            tempCanvas.toBlob(async (blob) => {
              if (blob) {
                const formData = new FormData();
                formData.append('file', blob, 'webcam_frame.jpg');

                try {
                  const response = await fetch(`${BACKEND_URL}/analyze_ultrasound/`, { // Use BACKEND_URL
                    method: 'POST',
                    body: formData,
                  });

                  if (!response.ok) {
                      const errorData = await response.json().catch(() => ({ detail: response.statusText }));
                      console.error(`Webcam Analysis API Error (${response.status}): ${errorData.detail || 'Unknown error'}`);
                      setLatestDetectionResult(null); // Clear state for text overlay
                      fetchedResultThisFrame = null;
                  } else {
                      const result = await response.json();
                      console.log("[Webcam Analysis] Raw result from backend:", result);
                      // console.log("[Webcam Analysis] Boxes received:", result.boxes); // Keep commented unless needed
                      // Update state for the text info display overlay
                      setLatestDetectionResult({
                         plane_type: result.plane_type,
                         quality_score: result.quality_score,
                         detected_structures: result.detected_structures,
                         boxes: result.boxes || []
                      });
                      // Store the result fetched IN THIS FRAME for immediate drawing
                      fetchedResultThisFrame = result;
                  }
                } catch (error) {
                  console.error("Error sending webcam frame:", error);
                  setLatestDetectionResult(null); // Clear state for text overlay
                  fetchedResultThisFrame = null;
                }
              }
              resolve(); // Resolve the promise regardless of blob/fetch success/failure
            }, 'image/jpeg', 0.8);
        });

        setLastAnalysisTime(now); // Update last analysis time only after fetch attempt
      }

      // --- Draw Overlays (Always runs, using the result from this frame if available) ---
      const overlayCanvas = canvasRef.current;
      const videoElement = videoRef.current;
      if (overlayCanvas && videoElement && videoElement.videoWidth > 0) {
        const overlayCtx = overlayCanvas.getContext('2d');
        // Pass the result fetched *in this frame* (or null if none/failed) to the drawing function
        drawOverlays(overlayCtx, videoElement, fetchedResultThisFrame);
      }

      // --- Schedule next frame ---
      animationFrameId.current = requestAnimationFrame(analyzeFrame);
    };

    // Start the loop
    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    animationFrameId.current = requestAnimationFrame(analyzeFrame);
  };

  const startCamera = async () => {
    console.log("[startCamera] Attempting to start camera...");
    setWebcamError(null);
    setLatestDetectionResult(null);
    stopCamera(); // Ensure any existing stream is stopped first

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        console.log("[startCamera] Requesting media devices...");
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: "environment" 
          } 
        });
        console.log("[startCamera] Media stream obtained:", stream);
        setVideoStream(stream);
        setIsCameraActive(true);
      } catch (err) {
        console.error("[startCamera] Error accessing webcam:", err);
        let errorMessage = "Could not access webcam. ";
        if (err.name === "NotAllowedError") {
          errorMessage += "Permission denied.";
        } else if (err.name === "NotFoundError") {
          errorMessage += "No camera found.";
        } else {
          errorMessage += err.message;
        }
        setWebcamError(errorMessage);
        setIsCameraActive(false);
        setVideoStream(null);
      }
    } else {
      console.error("[startCamera] navigator.mediaDevices.getUserMedia not supported.");
      setWebcamError("Webcam access not supported by this browser.");
    }
  };

  const stopCamera = () => {
    console.log("[stopCamera] Stopping camera and analysis loop...")
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
    }
    setIsCameraActive(false); 
    setVideoStream(null);
    setLatestDetectionResult(null);

    // Clear the canvas when stopping
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

   // Effect hook to handle attaching the stream to the video element
   useEffect(() => {
     if (isCameraActive && videoStream && videoRef.current) {
       console.log("[useEffect] Attaching stream to video element.");
       videoRef.current.srcObject = videoStream;
       videoRef.current.muted = true;
       videoRef.current.onloadedmetadata = () => {
         console.log("[useEffect] Video metadata loaded. Attempting to play...");
         videoRef.current.play().then(() => {
             console.log("[useEffect] Video playback started. Starting analysis loop.");
             startAnalysisLoop(); // Start analysis only after playback begins
         }).catch(err => {
             console.error("[useEffect] Video play() failed:", err);
             setWebcamError("Failed to play video stream.");
             stopCamera(); // Stop everything if play fails
         });
       };
     } else {
       // Optional: Cleanup if the camera stops or stream is lost while component is mounted
       // This might be redundant due to stopCamera being called elsewhere, but can be a safeguard.
       if (!isCameraActive && animationFrameId.current) {
          console.log("[useEffect] Camera not active, ensuring loop is stopped.");
          cancelAnimationFrame(animationFrameId.current);
          animationFrameId.current = null;
       }
     }
   }, [isCameraActive, videoStream]); // Re-run when camera state or stream changes


   // Cleanup webcam on component unmount
   useEffect(() => {
       return () => {
           console.log("[Unmount] Stopping camera.");
           stopCamera();
       };
   }, []); // Empty dependency array ensures this runs only on unmount

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <main className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        {/* Sidebar */}
        <div
          className={`${showSidebar ? "w-64" : (isMobile ? "w-0" : "w-16")} ${isMobile && !showSidebar ? 'overflow-hidden' : ''} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col`}
        >
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-center">
            {showSidebar ? (
              <h2 className="font-bold text-blue-700 dark:text-blue-400">BirthSense AI</h2>
            ) : (
              <div className="bg-blue-600 text-white p-2 rounded-lg">
                <Stethoscope className="h-5 w-5" />
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="py-4">
              <button
                className={`w-full flex items-center px-4 py-2 ${activeTab === "chat" ? "bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-400" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                onClick={() => setActiveTab("chat")}
              >
                <FileText className="h-5 w-5" />
                {showSidebar && <span className="ml-3">Chat</span>}
              </button>
              <button
                className={`w-full flex items-center px-4 py-2 ${activeTab === "patient" ? "bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-400" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                onClick={() => setActiveTab("patient")}
              >
                <User className="h-5 w-5" />
                {showSidebar && <span className="ml-3">Patient</span>}
              </button>
              <button
                className={`w-full flex items-center px-4 py-2 ${activeTab === "analytics" ? "bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-400" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                onClick={() => setActiveTab("analytics")}
              >
                <BarChart2 className="h-5 w-5" />
                {showSidebar && <span className="ml-3">Analytics</span>}
              </button>
              <button
                className={`w-full flex items-center px-4 py-2 ${activeTab === "help" ? "bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-400" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                onClick={() => setActiveTab("help")}
              >
                <Info className="h-5 w-5" />
                {showSidebar && <span className="ml-3">Help</span>}
              </button>
            </div>
          </div>
          {/* Hide toggle button on mobile */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 hidden md:block">
            <button
              className="w-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              {showSidebar ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>
          </div>
        </div>


        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden"> {/* Added overflow-hidden here */}
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-white dark:bg-gray-800 shadow-sm dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                BirthSense AI
              </h1>
            </div>
            <div className="flex items-center">
              <button
                className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
                onClick={toggleTheme}
              >
                {theme === "light" ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path> </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"> <circle cx="12" cy="12" r="4"></circle> <path d="M12 2v2"></path> <path d="M12 20v2"></path> <path d="m4.93 4.93 1.41 1.41"></path> <path d="m17.66 17.66 1.41 1.41"></path> <path d="M2 12h2"></path> <path d="M20 12h2"></path> <path d="m6.34 17.66-1.41 1.41"></path> <path d="m19.07 4.93-1.41 1.41"></path> </svg>
                )}
              </button>
              <div className="text-xs text-gray-500 dark:text-gray-400 hidden md:block mr-4">
                Medical Imaging Analysis System
              </div>
              <div className="relative" ref={dropdownRef}>
                <button
                  className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 flex items-center justify-center text-white"> <User className="h-5 w-5" /> </div>
                  <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </button>
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 border border-gray-200 dark:border-gray-700">
                    <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"> <Settings className="h-4 w-4 mr-2" /> Settings </button>
                    <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"> <LogOut className="h-4 w-4 mr-2" /> Sign out </button>
                  </div>
                )}
              </div>
            </div>
          </div>


          {/* Main Content Area */}
          <div className="flex-1 flex flex-col overflow-hidden"> {/* Changed to flex-col and overflow-hidden */}
            {/* Chat Area */}
            {activeTab === "chat" ? (
              <div className="flex-1 flex flex-col h-full"> {/* Ensured flex-col and full height */}

                {/* Webcam Display Area */}
                {isCameraActive && (
                    <div className="relative p-4 border-b dark:border-gray-700 bg-black flex justify-center items-center">
                        <video 
                            ref={videoRef} 
                            className="max-w-full max-h-[40vh] h-auto block rounded shadow-lg" 
                            playsInline
                        />
                        {/* Overlay Canvas (initially hidden/transparent, for future use) */}
                        <canvas 
                            ref={canvasRef} 
                            className="absolute top-0 left-0 w-full h-full pointer-events-none" 
                            // Style to ensure it overlays correctly if needed
                        />
                        {/* Display latest detection results - Enhanced */} 
                        {latestDetectionResult && (
                            <div className={`absolute bottom-2 left-2 bg-black bg-opacity-70 text-white p-3 rounded-lg shadow-lg max-w-xs text-xs space-y-1 border-l-4 ${latestDetectionResult.plane_type === 'Standard' ? 'border-green-500' : 'border-red-500'}`}>
                                {/* Plane Type & Score */} 
                                <div className="flex items-center justify-between">
                                    <div className={`font-semibold flex items-center ${latestDetectionResult.plane_type === 'Standard' ? 'text-green-400' : 'text-red-400'}`}>
                                        {latestDetectionResult.plane_type === 'Standard' ? <CheckCircle2 className="h-4 w-4 mr-1" /> : <XCircle className="h-4 w-4 mr-1" />}
                                        {latestDetectionResult.plane_type}
                                    </div>
                                    <div className="flex items-center text-gray-300">
                                        <div className="w-16 h-1.5 bg-gray-600 rounded-full overflow-hidden ml-2 mr-1">
                                            <div 
                                                className={`h-full rounded-full ${latestDetectionResult.quality_score >= 70 ? 'bg-green-500' : latestDetectionResult.quality_score >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                style={{ width: `${latestDetectionResult.quality_score}%` }}
                                            ></div>
                                        </div>
                                         {latestDetectionResult.quality_score?.toFixed(0)}
                                    </div>
                                </div>
                                {/* Detected Structures */} 
                                <div className="pt-1">
                                    <span className="font-medium text-gray-300">Detected:</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {latestDetectionResult.detected_structures?.length > 0 ? (
                                            latestDetectionResult.detected_structures.map((structure, index) => (
                                                <span key={index} className="inline-block px-1.5 py-0.5 rounded-full bg-gray-600 text-gray-200 text-[10px]">
                                                    {structure}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-gray-400 text-[10px]">None</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                        <button 
                            onClick={stopCamera} 
                            className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"
                        >
                            <VideoOff className="h-5 w-5" />
                        </button>
                    </div>
                )}
                {webcamError && !isCameraActive && (
                    <div className="p-4 text-center text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-b dark:border-gray-700">
                         <AlertCircle className="inline h-5 w-5 mr-2" /> {webcamError}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto p-4 space-y-4"> {/* This scrolls */}
                  {messages.map((message, index) => (
                    <ChatMessage key={`message-${index}`} message={message} index={index} />
                  ))}
                   {isLoading && !isCameraActive && (
                    <div className="flex flex-col items-center p-4">
                      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center mb-2">
                          <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400 mr-2" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {processingStage || "Processing..."}
                          </span>
                        </div>
                        </div>
                      </div>
                    )}
                    {apiError && !isLoading && (
                      <div className="flex justify-center px-4">
                          <div className="w-full max-w-2xl rounded-lg p-4 shadow-sm bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 flex items-center">
                              <AlertCircle className="h-5 w-5 mr-3 flex-shrink-0"/>
                              <span className="text-sm">{apiError}</span>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Current Image Preview / Clear Button */}
                {previewImage && !isCameraActive && (
                    <div className="p-2 px-4 border-t bg-white dark:bg-gray-800 dark:border-gray-700 flex justify-between items-center">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <img
                                src={previewImage}
                                alt="Current file preview"
                                className="h-10 w-10 object-cover rounded border dark:border-gray-600 cursor-default bg-gray-100 dark:bg-gray-700"
                            />
                            <span className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                {currentImage?.name || 'Current Image'}
                            </span>
                        </div>
                        <button
                            onClick={handleClearImage}
                            className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                            title="Clear Image"
                        >
                            <X className="h-5 w-5"/>
                        </button>
                    </div>
                )}

                {/* Input Area */}
                <div className="p-4 border-t bg-white dark:bg-gray-800 shadow-lg dark:border-gray-700">
                  <div className="flex items-center gap-2 max-w-4xl mx-auto">
                    <div className="flex-1 relative">
                      <input
                        ref={inputRef}
                        placeholder={currentImage ? `Command for ${currentImage.name}...` : "Type command or use options..."} // Updated placeholder
                        value={input}
                        onChange={(e) => {
                          setInput(e.target.value)
                          if (e.target.value.startsWith("/") && e.target.value.indexOf(" ") === -1) {
                            setShowCommandSuggestions(true)
                          } else {
                            setShowCommandSuggestions(false)
                          }
                        }}
                        onKeyDown={handleKeyDown}
                        className="w-full p-3 rounded-full border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent pl-4 pr-12 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 disabled:opacity-50"
                        disabled={isLoading}
                      />

                      {showCommandSuggestions && input.startsWith('/') && (
                        <div className="absolute bottom-full left-0 mb-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-10 max-h-48 overflow-y-auto">
                          {commandSuggestions
                            .filter(suggestion => suggestion.command.startsWith(input))
                            .map((suggestion, index) => (
                            <div
                              key={index}
                              className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 cursor-pointer flex items-center"
                              onClick={() => handleCommandClick(suggestion.command)}
                            >
                              <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-2">
                                <span className="text-xs text-blue-700 dark:text-blue-400 font-bold">/</span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                  {suggestion.command}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">{suggestion.description}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2">
                       <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/jpeg,image/png,image/webp,.nii,.nii.gz"
                       />

                       {/* Desktop Buttons (Visible md and up) */}
                       <div className="hidden md:flex items-center gap-2">
                        <button
                          className="p-2.5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
                          onClick={handleButtonClick}
                             title="Select Demo Image"
                             disabled={isLoading}
                           >
                              {/* ... SVG ... */}
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                   <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                               </svg>
                           </button>

                           <button
                             className="p-2.5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
                             onClick={() => fileInputRef.current?.click()}
                             title="Upload Local File"
                             disabled={isLoading}
                           >
                              {/* ... SVG ... */}
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                        </button>

                           {!isCameraActive ? (
                               <button
                                   className="p-2.5 rounded-full bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 text-green-700 dark:text-green-300 transition-colors"
                                   onClick={startCamera}
                                   title="Start Real-time Detection"
                                   disabled={isLoading || isCameraActive}
                               >
                                   <Video className="h-5 w-5"/>
                               </button>
                           ) : (
                                <button
                                   className="p-2.5 rounded-full bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-700 dark:text-red-300 transition-colors"
                                   onClick={stopCamera}
                                   title="Stop Real-time Detection"
                               >
                                   <VideoOff className="h-5 w-5"/>
                               </button>
                           )}
                      </div>

                       {/* Mobile Options Button (Visible below md) */}
                       <div className="relative md:hidden">
                      <button
                               className="mobile-options-trigger p-2.5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
                               onClick={() => setShowMobileOptions(!showMobileOptions)}
                               title="More Options"
                        disabled={isLoading}
                           >
                               <Plus className="h-5 w-5"/>
                           </button>
                           {/* Mobile Options Dropdown */}
                           {showMobileOptions && (
                               <div ref={mobileOptionsRef} className="absolute bottom-full right-0 mb-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-20 border border-gray-200 dark:border-gray-700">
                                   <button
                                       className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                                       onClick={() => { handleButtonClick(); setShowMobileOptions(false); }}
                                       disabled={isLoading}
                                   >
                                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /> </svg>
                                       Demo Image
                                   </button>
                                   <button
                                       className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
                                       onClick={() => { fileInputRef.current?.click(); setShowMobileOptions(false); }}
                                       disabled={isLoading}
                                   >
                                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}> <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /> </svg>
                                       Upload File
                                   </button>
                                   {!isCameraActive ? (
                                        <button
                                           className="flex items-center w-full px-4 py-2 text-sm text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30 disabled:opacity-50"
                                           onClick={() => { startCamera(); setShowMobileOptions(false); }}
                                           disabled={isLoading || isCameraActive}
                                        >
                                           <Video className="h-4 w-4 mr-2"/> Start Camera
                                        </button>
                                   ) : (
                                       <button
                                           className="flex items-center w-full px-4 py-2 text-sm text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30"
                                           onClick={() => { stopCamera(); setShowMobileOptions(false); }}
                                       >
                                            <VideoOff className="h-4 w-4 mr-2"/> Stop Camera
                                       </button>
                                   )}
                               </div>
                           )}
                       </div>

                       {/* Send Button (Always Visible) */}
                       <button
                         onClick={handleSendMessage}
                         disabled={isLoading || (!input.trim() && !currentImage) }
                         className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 text-white hover:from-blue-600 hover:to-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-500 disabled:hover:to-blue-700"
                        title="Send Message"
                      >
                        <Send className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                      {currentImage ? `Ready for command on ${currentImage.name}.` : 'Type command or use options button.'} {/* Updated text */}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto">
                {activeTab === "patient" && (
                  <div className="p-4 space-y-4">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200 flex items-center">
                      <User className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                      Patient Information
                    </h3>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-3 border border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Name:</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">{patientData.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Age:</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">{patientData.age}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Gestational Age:</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {patientData.gestationalAge}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Last Scan:</span>
                        <span className="font-medium text-gray-800 dark:text-gray-200">{patientData.lastScan}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 block mb-1">Risk Factors:</span>
                        <ul className="list-disc pl-5 text-sm text-gray-800 dark:text-gray-200">
                          {patientData.riskFactors.map((risk, index) => (
                            <li key={index}>{risk}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="text-gray-500 dark:text-gray-400 block mb-1">Notes:</span>
                        <p className="text-sm text-gray-800 dark:text-gray-200">{patientData.notes}</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "analytics" && (
                  <div className="p-4 space-y-4">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200 flex items-center">
                      <BarChart2 className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                      Analytics
                    </h3>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-4 border border-gray-200 dark:border-gray-700">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg border border-blue-100 dark:border-blue-900">
                          <div className="text-sm text-blue-700 dark:text-blue-300">Total Scans</div>
                          <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">
                            {analyticsData.scansThisMonth}
                          </div>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg border border-green-100 dark:border-green-900">
                          <div className="text-sm text-green-700 dark:text-green-300">Standard Planes</div>
                          <div className="text-2xl font-bold text-green-800 dark:text-green-200">
                            {analyticsData.standardPlanes}
                            <span className="text-xs ml-1">
                              ({Math.round((analyticsData.standardPlanes / analyticsData.scansThisMonth) * 100)}%)
                            </span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Quality Score Trend</div>
                        <div className="h-24 flex items-end space-x-1">
                          {analyticsData.weeklyTrend.map((score, index) => (
                            <div key={index} className="flex-1 bg-blue-500 rounded-t" style={{ height: `${score}%` }}>
                              <div className="text-xs text-white text-center mt-1">{score}</div>
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                          <span>Week 1</span>
                          <span>Week 2</span>
                          <span>Week 3</span>
                          <span>Week 4</span>
                        </div>
                      </div>

                      <div>
                        <div className="text-gray-700 dark:text-gray-300 mb-2 font-medium">Recent Scans</div>
                        <div className="space-y-2">
                          {analyticsData.recentScans.map((scan, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600"
                            >
                              <div className="text-sm text-gray-800 dark:text-gray-200">{scan.date}</div>
                              <div className="flex items-center">
                                <div
                                  className={`w-2 h-2 rounded-full ${scan.standard ? "bg-green-500" : "bg-red-500"} mr-2`}
                                ></div>
                                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                  {scan.quality}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-1">
                        <span className="text-gray-700 dark:text-gray-300 block mb-1 font-medium">
                          Most Common Issue:
                        </span>
                        <span className="text-sm bg-yellow-50 dark:bg-yellow-900/30 p-1 rounded border border-yellow-200 dark:border-yellow-900 inline-block text-yellow-800 dark:text-yellow-300">
                          {analyticsData.mostCommonIssue}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "help" && (
                  <div className="p-4 space-y-4">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200 flex items-center">
                      <Info className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
                      Help & Documentation
                    </h3>
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 space-y-4 border border-gray-200 dark:border-gray-700">
                      <h4 className="font-medium text-blue-700 dark:text-blue-400 flex items-center">
                        <Wand2 className="h-4 w-4 mr-2" />
                        Available Commands
                      </h4>
                      <div className="space-y-3">
                        <div className="border-l-2 border-blue-500 pl-3">
                          <div className="font-medium text-gray-800 dark:text-gray-200">/detect</div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Analyzes uploaded ultrasound images (JPG, PNG, WEBP) for standard plane classification and anatomical structures.
                          </p>
                        </div>
                        <div className="border-l-2 border-purple-500 pl-3">
                          <div className="font-medium text-gray-800 dark:text-gray-200">/segment</div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Segments brain structures in uploaded fetal MRI images (NIfTI format: .nii, .nii.gz). Shows an overlay preview.
                          </p>
                        </div>
                        <div className="border-l-2 border-gray-500 pl-3">
                          <div className="font-medium text-gray-800 dark:text-gray-200">/ask [question]</div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Ask questions about the uploaded image. (Currently uses example responses).
                          </p>
                        </div>
                      </div>

                      <h4 className="font-medium text-blue-700 dark:text-blue-400 mt-2 flex items-center">
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Example Questions
                      </h4>
                      <ul className="list-disc pl-5 text-sm space-y-1 text-gray-600 dark:text-gray-400">
                        {[
                          "Is this a standard plane?",
                          "Am I missing something in this ultrasound?",
                          "What's the quality of this image?",
                          "Are there any abnormalities in this scan?",
                          "What is the estimated gestational age based on this image?",
                        ].map((question, index) => (
                          <li key={index}>{question}</li>
                        ))}
                      </ul>

                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-900">
                        <h5 className="font-medium text-blue-700 dark:text-blue-400 flex items-center">
                          <Zap className="h-4 w-4 mr-1" />
                          Pro Tip
                        </h5>
                        <p className="text-sm text-blue-600 dark:text-blue-300 mt-1">
                          For the best results, upload clear, standard-plane images. Ensure NIfTI files are correctly formatted for segmentation.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Patient File Browser (Demo Image Modal) */}
      {showFileBrowser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Select Demo Image</h2>
              <button
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setShowFileBrowser(false)}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Demo Ultrasound */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow border border-transparent hover:border-blue-300 dark:hover:border-blue-600 flex flex-col items-center" onClick={() => handleSelectImageFromBrowser('/images/detect_image.webp', false)}>
                   <img src="/images/detect_image.webp" alt="Demo Ultrasound" className="w-full h-48 object-contain rounded mb-3 bg-gray-200 dark:bg-gray-600"/>
                   <h3 className="font-medium text-lg text-gray-800 dark:text-gray-200 text-center">Demo Ultrasound</h3>
                   <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">Use /detect command</p>
                    </div>
                 {/* Demo MRI (NIfTI) - Update path and image src */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 cursor-pointer hover:shadow-lg transition-shadow border border-transparent hover:border-purple-300 dark:hover:border-purple-600 flex flex-col items-center" onClick={() => handleSelectImageFromBrowser('/images/sub-001_0001.nii', true)}> {/* Updated file path here */}
                     {/* Use a placeholder image for NIfTI */}
                     <div className="w-full h-48 flex items-center justify-center rounded mb-3 bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400">
                        <Brain className="h-16 w-16" />
                        <span className="ml-2 text-sm">NIfTI File</span>
                      </div>
                     <h3 className="font-medium text-lg text-gray-800 dark:text-gray-200 text-center">Demo MRI (NIfTI)</h3>
                     <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">Use /segment command</p>
                    </div>
                  </div>
                </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App

