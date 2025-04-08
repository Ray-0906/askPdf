import React, { useState, useEffect,useRef } from "react";
import axios from "axios";
import { useDropzone } from "react-dropzone";
import { FiUpload, FiSend, FiFileText, FiLoader, FiChevronDown } from "react-icons/fi";
import { BsRobot, BsPerson, BsFilePdf } from "react-icons/bs";

function App() {
  const [question, setQuestion] = useState("");
  const [conversation, setConversation] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pdfName, setPdfName] = useState("");
  const [expandedSources, setExpandedSources] = useState(null);
  const chatContainerRef = useRef(null);
    const url=import.meta.env.VITE_API_URL;
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: "application/pdf",
    multiple: false,
    onDrop: async (files) => {
      setIsProcessing(true);
      setPdfName(files[0].name);
      const formData = new FormData();
      formData.append("pdf", files[0]);

      try {
        await axios.post(`${url}/api/upload`, formData);
        setConversation([{
          type: "ai",
          content: `PDF "${files[0].name}" uploaded successfully. Ask me anything about it!`,
          sources: []
        }]);
      } catch (error) {
        setConversation([{
          type: "ai",
          content: `Error processing PDF: ${error.response?.data?.error || error.message}`,
          sources: []
        }]);
      } finally {
        setIsProcessing(false);
      }
    },
  });

  const handleQuery = async () => {
    if (!question.trim() || !pdfName) return;

    try {
      // Add user question
      setConversation(prev => [...prev, { 
        type: "user", 
        content: question,
        sources: [] 
      }]);
      
      // Add temporary AI response
      setConversation(prev => [...prev, { 
        type: "ai", 
        content: "...",
        sources: [] 
      }]);
      
      setQuestion("");

      // Scroll to bottom
      setTimeout(() => {
        chatContainerRef.current?.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: "smooth"
        });
      }, 100);

      // Get actual response
      const response = await axios.post(`${url}/api/query`, {
        question,
      });

      // Update the temporary AI response
      setConversation(prev => 
        prev.map((item, idx) => 
          idx === prev.length - 1
            ? { ...item, content: response.data.answer, sources: response.data.sources }
            : item
        )
      );
    } catch (error) {
      setConversation(prev => [...prev.slice(0, -1), {
        type: "ai",
        content: `Error: ${error.response?.data?.error || error.message}`,
        sources: []
      }]);
    }
  };

  const toggleSourceExpand = (index) => {
    setExpandedSources(expandedSources === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm py-4 px-6">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-indigo-600 flex items-center">
            <BsFilePdf className="mr-2" /> PDF Insight AI
          </h1>
          {pdfName && (
            <span className="bg-indigo-100 text-indigo-800 text-sm px-3 py-1 rounded-full flex items-center max-w-xs truncate">
              <FiFileText className="mr-1 flex-shrink-0" /> 
              <span className="truncate">{pdfName}</span>
            </span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Panel */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden lg:col-span-1">
          <div className="p-6 h-full flex flex-col">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Upload Document</h2>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 flex-1 flex flex-col items-center justify-center ${
                isDragActive
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-300 hover:border-indigo-400 hover:bg-indigo-50"
              } ${isProcessing ? "opacity-70 pointer-events-none" : ""}`}
            >
              <input {...getInputProps()} />
              {isProcessing ? (
                <>
                  <FiLoader className="animate-spin text-indigo-600 text-3xl mb-3" />
                  <p className="text-gray-600">Processing PDF...</p>
                </>
              ) : (
                <>
                  <div className="mx-auto bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mb-3">
                    <FiUpload className="text-indigo-600 text-2xl" />
                  </div>
                  <p className="text-gray-700 mb-1">
                    {isDragActive ? "Drop the PDF here" : "Drag & drop a PDF"}
                  </p>
                  <p className="text-sm text-gray-500">or click to browse</p>
                  <p className="text-xs text-gray-400 mt-3">Supports single PDF files</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Chat Panel */}
        <div className="bg-white rounded-xl shadow-md justify-between overflow-hidden lg:col-span-2 flex flex-col">
          {/* Conversation */}
          <div 
            ref={chatContainerRef}
            className="flex-1 p-6 overflow-y-auto space-y-6"
            style={{ maxHeight: "60vh" }}
          >
            {conversation.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                <BsRobot className="text-4xl mb-3" />
                <p>Upload a PDF to start chatting</p>
              </div>
            ) : (
              conversation.map((item, index) => (
                <div key={index} className="space-y-4">
                  {/* User Message */}
                  {item.type === "user" && (
                    <div className="flex items-start space-x-3">
                      <div className="bg-indigo-100 p-2 rounded-full flex-shrink-0">
                        <BsPerson className="text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">You</p>
                        <p className="text-gray-700 mt-1 whitespace-pre-wrap">{item.content}</p>
                      </div>
                    </div>
                  )}
                  
                  {/* AI Message */}
                  {item.type === "ai" && (
                    <div className="flex items-start space-x-3">
                      <div className="bg-gray-100 p-2 rounded-full flex-shrink-0">
                        <BsRobot className="text-gray-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">AI Assistant</p>
                        <p className="text-gray-700 mt-1 whitespace-pre-wrap">
                          {item.content === "..." ? (
                            <span className="inline-flex items-center">
                              <FiLoader className="animate-spin mr-2" /> Thinking...
                            </span>
                          ) : (
                            item.content
                          )}
                        </p>
                        
                        {/* Sources */}
                        {item.sources && item.sources.length > 0 && (
                          <div className="mt-3 border-t border-gray-100 pt-3">
                            <button
                              onClick={() => toggleSourceExpand(index)}
                              className="flex items-center text-sm text-indigo-600 hover:text-indigo-800"
                            >
                              <FiChevronDown className={`mr-1 transition-transform ${
                                expandedSources === index ? "rotate-180" : ""
                              }`} />
                              {expandedSources === index ? "Hide" : "Show"} references
                            </button>
                            
                            {expandedSources === index && (
                              <div className="mt-2 space-y-2">
                                {item.sources.map((source, idx) => (
                                  <div 
                                    key={idx} 
                                    className="bg-gray-50 rounded-lg p-3 text-sm border border-gray-200"
                                  >
                                    <p className="font-medium text-gray-700 flex items-center">
                                      <FiFileText className="mr-1" />
                                      Page {source.page}
                                    </p>
                                    <p className="text-gray-600 mt-1 whitespace-pre-wrap">
                                      {source.content}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200  p-4 bg-gray-50">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleQuery()}
                placeholder={
                  pdfName
                    ? `Ask about ${pdfName}`
                    : "Please upload a PDF first"
                }
                className="flex-1 border border-gray-300 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                disabled={!pdfName}
              />
              <button
                onClick={handleQuery}
                disabled={!question.trim() || !pdfName}
                className={`p-3 rounded-full ${
                  question.trim() && pdfName
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                } transition-colors`}
              >
                <FiSend />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;


