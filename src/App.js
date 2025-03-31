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
} from "lucide-react"

// Simulating the nifti-reader-js import
// In a real app, you would use: import { readHeader, readImage, isCompressed, decompress } from 'nifti-reader-js'
const niftiReader = {
  readHeader: () => ({}),
  readImage: () => new Uint8Array(100),
  isCompressed: () => false,
  decompress: (buffer) => buffer,
}

function App() {
  const [messages, setMessages] = useState([
    {
      role: "system",
      content:
        "Welcome to BirthSense AI. Upload an image and use commands like `/detect`, `/segment`, or `/ask` followed by your question.",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [currentImage, setCurrentImage] = useState(null)
  const [showSidebar, setShowSidebar] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)
  const [activeTab, setActiveTab] = useState("chat")
  const [processingProgress, setProcessingProgress] = useState(0)
  const [processingStage, setProcessingStage] = useState("")
  const [previewImage, setPreviewImage] = useState(null)
  const [theme, setTheme] = useState("light")
  const [showCommandSuggestions, setShowCommandSuggestions] = useState(false)
  const [showFileBrowser, setShowFileBrowser] = useState(false)

  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)

  // Sample patient data for demo
  const patientData = {
    name: "Akosua Mensah",
    age: 32,
    gestationalAge: "24 weeks 3 days",
    lastScan: "2023-11-15",
    riskFactors: ["Previous preterm birth", "Gestational diabetes"],
    notes: "Patient is responding well to current management plan.",
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
    { command: "/detect", description: "Analyze anatomical structures" },
    { command: "/segment", description: "Segment brain structures" },
    { command: "/ask", description: "Ask questions about the image" },
  ]

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = async () => {
    if (!input.trim() && !currentImage) return

    // Add user message to chat
    const userMessage = {
      role: "user",
      content: input,
      image: currentImage,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setProcessingProgress(0)
    setProcessingStage("")
    setShowCommandSuggestions(false)

    // Process commands
    if (input.startsWith("/detect")) {
      await processDetectCommand(input)
    } else if (input.startsWith("/segment")) {
      await processSegmentCommand(input)
    } else if (input.startsWith("/ask")) {
      await processAskCommand(input)
    } else {
      // Default response if no command is specified
      setTimeout(() => {
        const responseMessage = {
          role: "assistant",
          content: "Please use one of the available commands: `/detect`, `/segment`, or `/ask [your question]`",
          timestamp: new Date().toISOString(),
        }

        setMessages((prev) => [...prev, responseMessage])
        setIsLoading(false)
      }, 500)
    }
  }

  const simulateProgress = async (duration, stages) => {
    const interval = duration / 100
    const stageInterval = duration / stages.length

    for (let i = 0; i <= 100; i++) {
      setProcessingProgress(i)
      if (i % (100 / stages.length) === 0) {
        const stageIndex = Math.floor(i / (100 / stages.length))
        if (stageIndex < stages.length) {
          setProcessingStage(stages[stageIndex])
        }
      }
      await new Promise((resolve) => setTimeout(resolve, interval))
    }
  }

  const processDetectCommand = async (command) => {
    if (!currentImage) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Please upload an ultrasound image first before using the /detect command.",
          timestamp: new Date().toISOString(),
        },
      ])
      setIsLoading(false)
      return
    }

    // Simulate processing with stages
    const stages = [
      "Loading detection model...",
      "Preprocessing image...",
      "Detecting anatomical structures...",
      "Analyzing plane quality...",
      "Generating report...",
    ]

    await simulateProgress(2000, stages)

    // Determine if the plane is standard or non-standard
    const isStandard = true // For demo purposes, we'll set this to true
    const qualityScore = 85.7 // Example quality score

    const responseMessage = {
      role: "assistant",
      content: `Detection complete. I've identified several anatomical structures in this 2D sagittal-view ultrasound image.
      
${isStandard ? "✓ Standard plane" : "✗ Non-standard plane"} (Score: ${qualityScore.toFixed(1)}/100)`,
      image: "/images/detect_results.webp",
      detectionResults: [
        { label: "thalami", confidence: 0.85 },
        { label: "midbrain", confidence: 0.86 },
        { label: "NT", confidence: 0.77 },
        { label: "IT", confidence: 0.63 },
        { label: "CM", confidence: 0.52 },
      ],
      isStandard: isStandard,
      qualityScore: qualityScore,
      timestamp: new Date().toISOString(),
      recommendations: [
        "Nuchal translucency (NT) measurement is within normal range.",
        "Intracranial translucency (IT) is visible, indicating normal posterior brain development.",
        "Consider slight adjustment to better visualize the nasal bone for a perfect standard plane.",
      ],
    }

    setMessages((prev) => [...prev, responseMessage])
    setIsLoading(false)
    setProcessingProgress(0)
    setProcessingStage("")
  }

  const processSegmentCommand = async (command) => {
    if (!currentImage) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Please upload an MRI image first before using the /segment command.",
          timestamp: new Date().toISOString(),
        },
      ])
      setIsLoading(false)
      return
    }

    // Simulate processing with stages
    const stages = [
      "Loading segmentation model...",
      "Preprocessing MRI volume...",
      "Applying 3D U-Net...",
      "Refining segmentation boundaries...",
      "Post-processing results...",
    ]

    await simulateProgress(3000, stages)

    const responseMessage = {
      role: "assistant",
      content:
        "Segmentation complete. I've identified and segmented the following brain structures in this central slice MRI:",
      image: "/images/segment_results.webp",
      segmentationResults: [
        { label: "Background", colorClass: "bg-blue-500" },
        { label: "Intracranial space", colorClass: "bg-green-500" },
        { label: "Gray matter", colorClass: "bg-red-500" },
        { label: "White matter", colorClass: "bg-yellow-500" },
        { label: "Ventricles", colorClass: "bg-purple-500" },
        { label: "Cerebellum", colorClass: "bg-pink-500" },
        { label: "Deep gray matter", colorClass: "bg-orange-500" },
        { label: "Brainstem", colorClass: "bg-teal-500" },
      ],
      timestamp: new Date().toISOString(),
      volumetrics: {
        totalBrainVolume: "425.3 cm³",
        grayMatterVolume: "203.1 cm³",
        whiteMatterVolume: "178.6 cm³",
        ventriclesVolume: "15.2 cm³",
        cerebellumVolume: "28.4 cm³",
      },
      findings:
        "All brain structures appear to be developing normally for gestational age. Ventricle size is within normal range.",
    }

    setMessages((prev) => [...prev, responseMessage])
    setIsLoading(false)
    setProcessingProgress(0)
    setProcessingStage("")
  }

  const processAskCommand = async (command) => {
    if (!currentImage) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Please upload an image first before using the /ask command.",
          timestamp: new Date().toISOString(),
        },
      ])
      setIsLoading(false)
      return
    }

    const question = command.replace("/ask", "").trim()

    // Simulate processing with stages
    const stages = [
      "Analyzing image...",
      "Processing question...",
      "Retrieving medical knowledge...",
      "Generating response...",
    ]

    await simulateProgress(2500, stages)

    // Example responses based on the question
    let response = "I'm analyzing the image, but I need a more specific question about what you're looking for."

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

  const handleImageUpload = (imageUrl, isNifti) => {
    setCurrentImage(imageUrl)

    const userMessage = {
      role: "user",
      content: "I've uploaded a new image for analysis.",
      image: imageUrl,
      timestamp: new Date().toISOString(),
    }

    const assistantMessage = {
      role: "assistant",
      content:
        "Image received. You can now use `/detect` to identify anatomical structures, `/segment` to segment the image, or `/ask [question]` to ask about specific aspects of the image.",
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage, assistantMessage])
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

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Handle NIfTI files
    if (file.name.toLowerCase().endsWith(".nii") || file.name.toLowerCase().endsWith(".nii.gz")) {
      const reader = new FileReader()
      reader.onload = async () => {
        try {
          const buffer = reader.result
          let data = buffer

          // Check if the file is compressed and decompress if needed
          if (niftiReader.isCompressed(buffer)) {
            data = niftiReader.decompress(buffer)
          }

          const header = niftiReader.readHeader(data)
          const image = niftiReader.readImage(header, data)

          // Create a placeholder image
          const canvas = document.createElement("canvas")
          canvas.width = 256
          canvas.height = 256
          const ctx = canvas.getContext("2d")
          ctx.fillStyle = "#f0f0f0"
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.fillStyle = "#666"
          ctx.font = "14px Arial"
          ctx.textAlign = "center"
          ctx.fillText("NIfTI Image Loaded", canvas.width / 2, canvas.height / 2)

          const imageUrl = canvas.toDataURL()

          handleImageUpload(imageUrl, true)
        } catch (error) {
          console.error("Error reading NIfTI file:", error)
          // Show error message to user
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "Error reading the NIfTI file. Please make sure it's a valid NIfTI format.",
              timestamp: new Date().toISOString(),
            },
          ])
        }
      }
      reader.readAsArrayBuffer(file)
    } else {
      // Handle regular images
      const reader = new FileReader()
      reader.onload = () => {
        const imageUrl = reader.result

        // For demo purposes, we'll use sample images
        if (
          file.name.toLowerCase().includes("ultrasound") ||
          file.name.toLowerCase().includes("us") ||
          file.type.includes("image")
        ) {
          handleImageUpload("/images/detect_image.webp", false)
        } else if (file.name.toLowerCase().includes("mri") || file.name.toLowerCase().includes("brain")) {
          handleImageUpload("/images/segment_image.jpg", false)
        } else {
          handleImageUpload(imageUrl, false)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleButtonClick = () => {
    setShowFileBrowser(true)
  }

  const handleClearImage = () => {
    setCurrentImage(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
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

  const handleSelectImageFromBrowser = (imageUrl, isMri) => {
    if (isMri) {
      handleImageUpload("/images/segment_image.jpg", false)
    } else {
      handleImageUpload("/images/detect_image.webp", false)
    }
  }

  // Chat Message Component
  function ChatMessage({ message, index }) {
    const isUser = message.role === "user"
    const isSystem = message.role === "system"
    const [expanded, setExpanded] = useState(true)

    const handleImageClick = () => {
      if (message.image) {
        setPreviewImage(message.image)
      }
    }

    return (
      <div className={`flex w-full ${isUser ? "justify-end" : "justify-start"} ${isSystem && "justify-center"}`}>
        <div
          className={`rounded-lg p-4 max-w-[80%] shadow-sm ${
            isUser
              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
              : isSystem
                ? "bg-gray-100 text-gray-600 text-center text-sm dark:bg-gray-700 dark:text-gray-300"
                : "bg-white border border-gray-200 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200"
          } ${message.image && "max-w-md"} transition-all duration-300 hover:shadow-md`}
        >
          <div className="flex justify-between items-start">
            <div className="flex items-center mb-1">
              {!isSystem && (
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center mr-2 ${isUser ? "bg-blue-700" : "bg-blue-100 dark:bg-blue-900"}`}
                >
                  {isUser ? (
                    <User className="h-3 w-3 text-white" />
                  ) : (
                    <Stethoscope className="h-3 w-3 text-blue-700 dark:text-blue-400" />
                  )}
                </div>
              )}
              <span className="text-xs opacity-70">{message.timestamp && formatTimestamp(message.timestamp)}</span>
            </div>
            {(message.detectionResults ||
              message.segmentationResults ||
              message.recommendations ||
              message.references ||
              message.volumetrics) && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs opacity-70 hover:opacity-100 transition-opacity"
              >
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
            )}
          </div>

          {message.content && <p className="whitespace-pre-wrap">{message.content}</p>}

          {message.image && (
            <div
              className="mt-3 relative rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-90 transition-opacity"
              onClick={handleImageClick}
            >
              <img
                src={message.image || "/placeholder.svg"}
                alt="Uploaded image"
                className="object-contain max-w-full h-auto"
              />
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded flex items-center">
                <Maximize2 className="h-3 w-3 mr-1" />
                <span>Enlarge</span>
              </div>
            </div>
          )}

          {expanded && (
            <div>
              {message.isStandard !== undefined && (
                <div
                  className={`mt-3 p-3 rounded-md ${
                    message.isStandard
                      ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900"
                      : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-900"
                  }`}
                >
                  <div className="font-semibold flex items-center">
                    {message.isStandard ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        <span>Standard Plane</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-1" />
                        <span>Non-Standard Plane</span>
                      </>
                    )}
                  </div>
                  <div className="text-sm mt-1">
                    <div className="flex items-center">
                      <span>Quality Score:</span>
                      <div className="ml-2 w-24 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${message.isStandard ? "bg-green-500" : "bg-red-500"}`}
                          style={{ width: `${message.qualityScore}%` }}
                        />
                      </div>
                      <span className="ml-2">{message.qualityScore.toFixed(1)}/100</span>
                    </div>
                  </div>
                </div>
              )}

              {message.detectionResults && (
                <div className="mt-3 space-y-2">
                  <h4 className="font-medium text-sm flex items-center">
                    <Layers className="h-4 w-4 mr-1 text-blue-600 dark:text-blue-400" />
                    <span>Detected Structures:</span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {message.detectionResults.map((result, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
                      >
                        {result.label}
                        <span className="ml-1 text-xs opacity-80">{result.confidence.toFixed(2)}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {message.recommendations && (
                <div className="mt-3 p-3 bg-blue-50 rounded-md border border-blue-100 dark:bg-blue-900/20 dark:border-blue-900">
                  <h4 className="font-medium text-sm text-blue-800 dark:text-blue-300 mb-1 flex items-center">
                    <Lightbulb className="h-4 w-4 mr-1 text-blue-700 dark:text-blue-400" />
                    <span>Recommendations:</span>
                  </h4>
                  <ul className="list-disc pl-5 text-xs text-blue-700 dark:text-blue-300 space-y-1">
                    {message.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {message.segmentationResults && (
                <div className="mt-3 space-y-2">
                  <h4 className="font-medium text-sm flex items-center">
                    <Microscope className="h-4 w-4 mr-1 text-purple-600 dark:text-purple-400" />
                    <span>Segmentation Legend:</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {message.segmentationResults.map((result, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1.5 p-1 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <div className={`w-3 h-3 rounded-full ${result.colorClass}`}></div>
                        <span>{result.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {message.volumetrics && (
                <div className="mt-3 p-3 bg-purple-50 rounded-md border border-purple-100 dark:bg-purple-900/20 dark:border-purple-900">
                  <h4 className="font-medium text-sm text-purple-800 dark:text-purple-300 mb-1 flex items-center">
                    <Brain className="h-4 w-4 mr-1 text-purple-700 dark:text-purple-400" />
                    <span>Volumetric Analysis:</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-purple-700 dark:text-purple-300">
                    {Object.entries(message.volumetrics).map(([key, value], index) => (
                      <div key={index} className="flex justify-between">
                        <span>{key.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}:</span>
                        <span className="font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                  {message.findings && (
                    <div className="mt-2 pt-2 border-t border-purple-200 dark:border-purple-800 text-xs text-purple-800 dark:text-purple-300">
                      <span className="font-medium">Findings:</span> {message.findings}
                    </div>
                  )}
                </div>
              )}

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
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={theme === "dark" ? "dark" : ""}>
      <main className="flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        {/* Sidebar */}
        <div
          className={`${showSidebar ? "w-64" : "w-16"} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col`}
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
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <button
              className="w-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              {showSidebar ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-white dark:bg-gray-800 shadow-sm dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-2 rounded-lg">
                {/* <Stethoscope className="h-5 w-5" /> */}
              </div>
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
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"></path>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="4"></circle>
                    <path d="M12 2v2"></path>
                    <path d="M12 20v2"></path>
                    <path d="m4.93 4.93 1.41 1.41"></path>
                    <path d="m17.66 17.66 1.41 1.41"></path>
                    <path d="M2 12h2"></path>
                    <path d="M20 12h2"></path>
                    <path d="m6.34 17.66-1.41 1.41"></path>
                    <path d="m19.07 4.93-1.41 1.41"></path>
                  </svg>
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
                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 flex items-center justify-center text-white">
                    <User className="h-5 w-5" />
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                </button>
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 border border-gray-200 dark:border-gray-700">
                    <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </button>
                    <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Chat Area */}
            {activeTab === "chat" ? (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message, index) => (
                    <ChatMessage key={`message-${index}`} message={message} index={index} />
                  ))}
                  {isLoading && (
                    <div className="flex flex-col items-center p-4">
                      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center mb-2">
                          <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400 mr-2" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {processingStage || "Processing..."}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                            style={{ width: `${processingProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t bg-white dark:bg-gray-800 shadow-lg dark:border-gray-700">
                  <div className="flex items-center gap-2 max-w-4xl mx-auto">
                    <div className="flex-1 relative">
                      <input
                        ref={inputRef}
                        placeholder="Type a command (/detect, /segment, /ask)..."
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
                        className="w-full p-3 rounded-full border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent pl-4 pr-12 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                      />

                      {showCommandSuggestions && (
                        <div className="absolute bottom-full left-0 mb-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-10">
                          {commandSuggestions.map((suggestion, index) => (
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

                    <div className="flex items-center gap-2">
                      <div>
                        <button
                          className="p-2.5 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
                          onClick={handleButtonClick}
                          title="Select Patient Image"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                        </button>
                      </div>

                      <button
                        onClick={handleSendMessage}
                        disabled={isLoading}
                        className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 text-white hover:from-blue-600 hover:to-blue-800 transition-colors disabled:opacity-50 disabled:hover:from-blue-500 disabled:hover:to-blue-700"
                        title="Send Message"
                      >
                        <Send className="h-5 w-5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                    <span className="font-medium">Available commands:</span> /detect, /segment, /ask [your question]
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
                            Identifies anatomical structures in ultrasound images and classifies the plane as standard
                            or non-standard.
                          </p>
                        </div>
                        <div className="border-l-2 border-blue-500 pl-3">
                          <div className="font-medium text-gray-800 dark:text-gray-200">/segment</div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Segments brain structures in MRI images and provides volumetric analysis.
                          </p>
                        </div>
                        <div className="border-l-2 border-blue-500 pl-3">
                          <div className="font-medium text-gray-800 dark:text-gray-200">/ask [question]</div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Ask questions about the uploaded image to get detailed medical analysis.
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
                          For the best results, ensure your ultrasound images are clear and properly oriented. The
                          system works best with standard planes that clearly show anatomical landmarks.
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

      {/* Patient File Browser */}
      {showFileBrowser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Patient Files</h2>
              <button
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setShowFileBrowser(false)}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Ghanaian patients with single images */}
                <div
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleSelectImageFromBrowser("/images/detect_image.webp", false)}
                >
                  <div className="flex items-start">
                    <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-3 mr-3">
                      <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-gray-200">Akosua Mensah</h3>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <div>DOB: 1990-05-15</div>
                        <div>MRN: MRN12345</div>
                        <div>Last Visit: 2023-11-15</div>
                        <div className="mt-1 text-blue-600 dark:text-blue-400">2D Sagittal-view Ultrasound</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleSelectImageFromBrowser("/images/segment_image.jpg", true)}
                >
                  <div className="flex items-start">
                    <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-3 mr-3">
                      <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-gray-200">Kwame Osei</h3>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <div>DOB: 1985-08-22</div>
                        <div>MRN: MRN54321</div>
                        <div>Last Visit: 2023-11-10</div>
                        <div className="mt-1 text-purple-600 dark:text-purple-400">Brain MRI (Central Slice)</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleSelectImageFromBrowser("/images/detect_image.webp", false)}
                >
                  <div className="flex items-start">
                    <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-3 mr-3">
                      <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-gray-200">Ama Darko</h3>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <div>DOB: 1992-03-30</div>
                        <div>MRN: MRN98765</div>
                        <div>Last Visit: 2023-11-05</div>
                        <div className="mt-1 text-blue-600 dark:text-blue-400">2D Sagittal-view Ultrasound</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleSelectImageFromBrowser("/images/segment_image.jpg", true)}
                >
                  <div className="flex items-start">
                    <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-3 mr-3">
                      <User className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800 dark:text-gray-200">Kofi Agyeman</h3>
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <div>DOB: 1978-12-08</div>
                        <div>MRN: MRN45678</div>
                        <div>Last Visit: 2023-10-28</div>
                        <div className="mt-1 text-purple-600 dark:text-purple-400">Brain MRI (Central Slice)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 p-1 rounded-full bg-white dark:bg-gray-700 shadow-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors z-10"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="p-2">
              <img
                src={previewImage || "/placeholder.svg"}
                alt="Preview"
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App

