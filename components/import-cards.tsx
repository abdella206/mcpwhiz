"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ToolData } from "@/components/dynamic-code/types"

import { 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Play, 
  Upload, 
  FileText, 
  Check 
} from "lucide-react"

interface ImportCardsProps {
  // Swagger props
  swaggerUrl: string
  setSwaggerUrl: (url: string) => void
  swaggerFile: File | null
  setSwaggerFile: (file: File | null) => void
  isSwaggerImporting: boolean
  swaggerImportSuccess: boolean
  swaggerImportError: string
  swaggerImportedItems: ToolData[]
  swaggerSelectedItems: Set<number>
  setSwaggerSelectedItems: (items: Set<number>) => void
  onSwaggerImport: () => void
  onSwaggerImportSelected: () => void
  onOpenSwaggerModal: () => void
  
  // Postman props
  postmanFile: File | null
  setPostmanFile: (file: File | null) => void
  isPostmanImporting: boolean
  postmanImportSuccess: boolean
  postmanImportError: string
  postmanImportedItems: ToolData[]
  postmanSelectedItems: Set<number>
  setPostmanSelectedItems: (items: Set<number>) => void
  onPostmanImport: () => void
  onPostmanImportSelected: () => void
  onOpenPostmanModal: () => void
  
  // GraphQL props
  graphqlUrl: string
  setGraphqlUrl: (url: string) => void
  isGraphqlImporting: boolean
  graphqlImportSuccess: boolean
  graphqlImportError: string
  graphqlImportedItems: ToolData[]
  graphqlSelectedItems: Set<number>
  setGraphqlSelectedItems: (items: Set<number>) => void
  onGraphqlImport: () => void
  onGraphqlImportSelected: () => void
  onOpenGraphqlModal: () => void
  
  // Drag and drop states
  isDraggingSwagger: boolean
  setIsDraggingSwagger: (dragging: boolean) => void
  isDraggingPostman: boolean
  setIsDraggingPostman: (dragging: boolean) => void
  onSwaggerDragOver: (e: React.DragEvent) => void
  onSwaggerDragLeave: (e: React.DragEvent) => void
  onSwaggerDrop: (e: React.DragEvent) => void
  onPostmanDragOver: (e: React.DragEvent) => void
  onPostmanDragLeave: (e: React.DragEvent) => void
  onPostmanDrop: (e: React.DragEvent) => void
}

export function ImportCards({
  // Swagger
  swaggerUrl,
  setSwaggerUrl,
  swaggerFile,
  setSwaggerFile,
  isSwaggerImporting,
  swaggerImportSuccess,
  swaggerImportError,
  swaggerImportedItems,
  onSwaggerImport,
  
  // Postman
  postmanFile,
  setPostmanFile,
  isPostmanImporting,
  postmanImportError,
  postmanImportedItems,
  onPostmanImport,
  onOpenPostmanModal,
  
  // GraphQL
  graphqlUrl,
  setGraphqlUrl,
  isGraphqlImporting,
  graphqlImportError,
  graphqlImportedItems,
  onGraphqlImport,
  onOpenGraphqlModal,
  
  // Drag and drop
  isDraggingSwagger,
  isDraggingPostman,
  onSwaggerDragOver,
  onSwaggerDragLeave,
  onSwaggerDrop,
  onPostmanDragOver,
  onPostmanDragLeave,
  onPostmanDrop
}: ImportCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12 sm:mb-16 relative">
      {/* Swagger/OpenAPI Card */}
      <Card className="group border-2 border-green-400 shadow-xl hover:shadow-2xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 transition-all duration-500 sm:hover:scale-105 hover:border-green-500 relative overflow-hidden sm:transform sm:hover:-translate-y-2">
        <CardHeader className="text-center pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
              <path fill="#85ea2d" d="M63.999 124.945c-33.607 0-60.95-27.34-60.95-60.949C3.05 30.388 30.392 3.048 64 3.048s60.95 27.342 60.95 60.95c0 33.607-27.343 60.946-60.95 60.946z"/>
              <path fill="#173647" d="M40.3 43.311c-.198 2.19.072 4.454-.073 6.668-.173 2.217-.444 4.407-.888 6.596-.615 3.126-2.56 5.489-5.24 7.458 5.218 3.396 5.807 8.662 6.152 14.003.172 2.88.098 5.785.394 8.638.221 2.215 1.082 2.782 3.372 2.854.935.025 1.894 0 2.978 0v6.842c-6.768 1.156-12.354-.762-13.734-6.496a39.329 39.329 0 0 1-.836-6.4c-.148-2.287.097-4.577-.074-6.864-.492-6.277-1.305-8.393-7.308-8.689v-7.8c.441-.1.86-.174 1.302-.223 3.298-.172 4.701-1.182 5.414-4.43a37.512 37.512 0 0 0 .616-5.536c.247-3.569.148-7.21.763-10.754.86-5.094 4.01-7.556 9.254-7.852 1.476-.074 2.978 0 4.676 0v6.99c-.714.05-1.33.147-1.969.147-4.258-.148-4.48 1.304-4.8 4.848zm8.195 16.193h-.099c-2.462-.123-4.578 1.796-4.702 4.258-.122 2.485 1.797 4.603 4.259 4.724h.295c2.436.148 4.527-1.724 4.676-4.16v-.245c.05-2.486-1.944-4.527-4.43-4.577zm15.43 0c-2.386-.074-4.38 1.796-4.454 4.159 0 .149 0 .271.024.418 0 2.684 1.821 4.406 4.578 4.406 2.707 0 4.406-1.772 4.406-4.553-.025-2.682-1.823-4.455-4.554-4.43Zm15.801 0a4.596 4.596 0 0 0-4.676 4.454 4.515 4.515 0 0 0 4.528 4.528h.05c2.264.394 4.553-1.796 4.701-4.429.122-2.437-2.092-4.553-4.604-4.553Zm21.682.369c-2.855-.123-4.284-1.083-4.996-3.79a27.444 27.444 0 0 1-.811-5.292c-.198-3.298-.174-6.62-.395-9.918-.516-7.826-6.177-10.557-14.397-9.205v6.792c1.304 0 2.313 0 3.322.025 1.748.024 3.077.69 3.249 2.634.172 1.772.172 3.568.344 5.365.346 3.57.542 7.187 1.157 10.706.542 2.904 2.536 5.07 5.02 6.841-4.355 2.929-5.636 7.113-5.857 11.814-.122 3.223-.196 6.472-.368 9.721-.148 2.953-1.181 3.913-4.16 3.987-.835.024-1.648.098-2.583.148v6.964c1.748 0 3.347.1 4.946 0 4.971-.295 7.974-2.706 8.96-7.531.417-2.658.662-5.34.737-8.023.171-2.46.148-4.946.394-7.382.369-3.815 2.116-5.389 5.93-5.636a5.161 5.161 0 0 0 1.06-.245v-7.801c-.64-.074-1.084-.148-1.552-.173zM64 6.1c31.977 0 57.9 25.92 57.9 57.898 0 31.977-25.923 57.899-57.9 57.899-31.976 0-57.898-25.922-57.898-57.9C6.102 32.023 32.024 6.101 64 6.101m0-6.1C28.71 0 0 28.71 0 64c0 35.288 28.71 63.998 64 63.998 35.289 0 64-28.71 64-64S99.289.002 64 .002Z"/>
            </svg>
          </div>
          <CardTitle className="text-lg sm:text-xl text-green-700 dark:text-green-300 group-hover:text-green-800 dark:group-hover:text-green-200 transition-colors duration-300 font-bold">
            🚀 Swagger/OpenAPI
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Auto-detect endpoints
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Generate parameters
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Handle authentication
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="swagger-url" className="text-sm font-medium">
                OpenAPI Specification URL
              </Label>
              <Input
                id="swagger-url"
                value={swaggerUrl}
                onChange={(e) => setSwaggerUrl(e.target.value)}
                placeholder="https://petstore.swagger.io/v2/swagger.json"
                className="mt-1"
              />
            </div>
            <div className="text-center text-sm text-muted-foreground">or</div>
            <div>
              <Label htmlFor="swagger-file" className="text-sm font-medium">
                Upload OpenAPI File
              </Label>
              <div 
                className={`mt-1 border-2 border-dashed rounded-lg p-4 text-center transition-all duration-200 ${
                  isDraggingSwagger 
                    ? 'border-green-400 bg-green-50 dark:bg-green-950/30 scale-105' 
                    : 'border-green-200 hover:border-green-300'
                }`}
                onDragOver={onSwaggerDragOver}
                onDragLeave={onSwaggerDragLeave}
                onDrop={onSwaggerDrop}
              >
                <input
                  id="swagger-file"
                  type="file"
                  accept=".json,.yaml,.yml"
                  onChange={(e) => setSwaggerFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="swagger-file" className="cursor-pointer block">
                  <Upload className={`h-8 w-8 mx-auto mb-2 transition-colors ${
                    isDraggingSwagger ? 'text-green-600' : 'text-green-500'
                  }`} />
                  <p className={`text-sm transition-colors ${
                    isDraggingSwagger ? 'text-green-700 font-medium' : 'text-green-600'
                  }`}>
                    {isDraggingSwagger ? 'Drop here!' : 'Drop your OpenAPI file here or click to browse'}
                  </p>
                  {swaggerFile && (
                    <p className="text-xs text-green-600 mt-2">Selected: {swaggerFile.name}</p>
                  )}
                </label>
              </div>
            </div>
            
            {swaggerImportError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">{swaggerImportError}</span>
                </div>
              </div>
            )}
            
            {swaggerImportSuccess && (
              <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Successfully imported! Redirecting to wizard...</span>
                </div>
              </div>
            )}

            {swaggerImportedItems.length === 0 && (
              <Button
                onClick={onSwaggerImport}
                disabled={isSwaggerImporting || (!swaggerUrl && !swaggerFile)}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {isSwaggerImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Import Now
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Postman Card */}
      <Card className="group border-2 border-orange-400 shadow-xl hover:shadow-2xl bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 transition-all duration-500 sm:hover:scale-105 hover:border-orange-500 relative overflow-hidden sm:transform sm:hover:-translate-y-2">
        <CardHeader className="text-center pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <svg viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg">
              <path fill="#f37036" d="M113.117 26.066C92.168-1.062 53.191-6.07 26.062 14.883c-27.125 20.953-32.128 59.93-11.175 87.055 20.957 27.124 59.937 32.124 87.058 11.167 27.114-20.953 32.118-59.918 11.172-87.039Zm0 0"/>
              <path fill="#fff" d="M91.078 24.164a10.038 10.038 0 0 0-5.781 2.426 10.028 10.028 0 0 0-1.54 13.465 10.028 10.028 0 0 0 13.276 2.715h.002v.001l.156.155a10.63 10.63 0 0 0 1.965-1.45A10.341 10.341 0 0 0 99 27.107v-.002l-8.844 8.789-.156-.155 8.844-8.793a10.038 10.038 0 0 0-7.766-2.78zM79.434 38.551c-4.24-.007-11.163 4.799-28.067 21.703l.084.086c-.092-.032-.185-.035-.185-.035l-6.364 6.308a1.035 1.035 0 0 0 .93 1.762l10.914-2.328a.307.307 0 0 0 .092-.17l.242.25-3.72 3.69h-.18l-22.086 22.26 7.086 6.824a1.254 1.254 0 0 0 1.476.149 1.327 1.327 0 0 0 .645-1.356l-1.035-4.5a.534.534 0 0 1 0-.62 117.285 117.285 0 0 0 26.738-17.583l-4.535-4.537.086-.014-2.69-2.689.172-.174.182.186-.094.091 7.137 7.293v-.003c13.68-12.954 23.39-23.367 20.865-30.375a3.83 3.83 0 0 0-1.107-2.208v.004a3.778 3.778 0 0 0-.483-.306c-.083-.088-.156-.178-.244-.264l-.066.066a3.778 3.778 0 0 0-.582-.29l.289-.292c-1.796-1.6-3.28-2.924-5.5-2.93zM30.94 92.21l-5.171 5.172v.004a1.03 1.03 0 0 0-.457 1.125 1.035 1.035 0 0 0 .921.789l12.672.875-7.965-7.965z"/>
              <path fill="#f37036" d="M91.95 23.31a11.047 11.047 0 0 0-7.759 3.17 10.988 10.988 0 0 0-2.39 11.641c-4.741-2.03-11.155 1.51-31.106 21.457a.932.932 0 0 0-.037.094 1.242 1.242 0 0 0-.119.062l-6.309 6.364a1.97 1.97 0 0 0-.363 2.324 2.012 2.012 0 0 0 1.707.984l.313-.203 8.424-1.797-4.03 4.067a.873.873 0 0 0-.054.166l-19.75 19.799a.798.798 0 0 0-.192.238l-5.086 5.09a1.967 1.967 0 0 0-.414 2.043 1.995 1.995 0 0 0 1.656 1.265l12.618.88a1.01 1.01 0 0 0 .52-.415.886.886 0 0 0 0-1.035l-.026-.025a2.243 2.243 0 0 0 .705-.58 2.237 2.237 0 0 0 .406-1.876l-.984-4.187a126.725 126.725 0 0 0 26.334-16.861 1.091 1.091 0 0 0 .248.103c.254-.019.492-.128.672-.308 13.55-12.83 21.515-21.622 21.515-28.602a8.03 8.03 0 0 0-.431-2.85 10.957 10.957 0 0 0 3.845.83l-.015.004a11.219 11.219 0 0 0 5.183-1.45.775.775 0 0 0 .004.001.835.835 0 0 0 .617-.055 9.398 9.398 0 0 0 2.07-1.652 10.873 10.873 0 0 0 3.258-7.758 10.873 10.873 0 0 0-3.257-7.758.93.93 0 0 0-.118-.091 11.045 11.045 0 0 0-7.656-3.078zm-.087 1.772a9.27 9.27 0 0 1 5.586 1.914l-8.068 8.117a.84.84 0 0 0-.076.098.83.83 0 0 0-.239.55.832.832 0 0 0 .313.65h.002l6.1 6.1a9.044 9.044 0 0 1-10.028-1.913c-2.586-2.6-3.336-6.504-1.953-9.891 1.383-3.39 4.68-5.605 8.363-5.625zm7.12 3.432a8.87 8.87 0 0 1 2.033 5.674 9.15 9.15 0 0 1-2.688 6.464 9.989 9.989 0 0 1-1.098.895L92.307 36.7l-.963-.963.265-.265 7.373-6.96zm-.366 4.193a.777.777 0 0 0-.55.031.731.731 0 0 0-.36.426.73.73 0 0 0 .05.559 2.226 2.226 0 0 1-.257 2.328.64.64 0 0 0-.195.488c.004.184.07.36.195.492a.58.58 0 0 0 .414 0 .68.68 0 0 0 .672-.207 3.573 3.573 0 0 0 .465-3.777v.004a.777.777 0 0 0-.434-.344zM79.34 39.43a5.584 5.584 0 0 1 3.31 1.226 4.756 4.756 0 0 0-2.681 1.34L57.162 64.701l-4.476-4.476c11.828-11.772 19.06-17.921 23.556-19.936a5.584 5.584 0 0 1 3.098-.86zm3.965 2.96a2.895 2.895 0 0 1 2.043.844 2.786 2.786 0 0 1 .879 2.121 2.869 2.869 0 0 1-.985 2.07l-24.25 21.106-2.617-2.617 22.887-22.68a2.895 2.895 0 0 1 2.043-.843zm2.994 6.698c-1.69 6.702-10.647 15.783-19.987 24.607l-3.777-3.773L86.3 49.088zM51.367 61.547l.274.27 3.513 3.513-9.63 2.06 5.843-5.843zm5.793 5.84.004.004 1.168 1.195a1.086 1.086 0 0 0 .018.084l.078.012.248.254.82.84-5.385.66 3.05-3.05zm3.867 4.076 3.578 3.576A126.992 126.992 0 0 1 38.75 91.695a1.44 1.44 0 0 0-.777 1.653l1.035 4.5a.31.31 0 0 1 0 .363.31.31 0 0 1-.414 0l-6.102-6.152L51.3 72.975l9.728-1.512zm-29.933 21.94.869.814 4.492 4.492-10.016-.648 4.655-4.659z"/>
            </svg>
          </div>
          <CardTitle className="text-lg sm:text-xl text-orange-700 dark:text-orange-300 group-hover:text-orange-800 dark:group-hover:text-orange-200 transition-colors duration-300 font-bold">
            📮 Postman Collections
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-orange-500" />
              Import requests
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-orange-500" />
              Preserve headers
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-orange-500" />
              Environment variables
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="postman-file" className="text-sm font-medium">
                Upload Postman Collection
              </Label>
              <div 
                className={`mt-1 border-2 border-dashed rounded-lg p-4 text-center transition-all duration-200 ${
                  isDraggingPostman 
                    ? 'border-orange-400 bg-orange-50 dark:bg-orange-950/30 scale-105' 
                    : 'border-orange-200 hover:border-orange-300'
                }`}
                onDragOver={onPostmanDragOver}
                onDragLeave={onPostmanDragLeave}
                onDrop={onPostmanDrop}
              >
                <input
                  id="postman-file"
                  type="file"
                  accept=".json"
                  onChange={(e) => setPostmanFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
                <label htmlFor="postman-file" className="cursor-pointer block">
                  <FileText className={`h-8 w-8 mx-auto mb-2 transition-colors ${
                    isDraggingPostman ? 'text-orange-600' : 'text-orange-500'
                  }`} />
                  <p className={`text-sm transition-colors ${
                    isDraggingPostman ? 'text-orange-700 font-medium' : 'text-orange-600'
                  }`}>
                    {isDraggingPostman ? 'Drop here!' : 'Drop your .json collection file here or click to browse'}
                  </p>
                  {postmanFile && (
                    <p className="text-xs text-green-600 mt-2">Selected: {postmanFile.name}</p>
                  )}
                </label>
              </div>
            </div>
            
            {postmanImportError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">{postmanImportError}</span>
                </div>
              </div>
            )}
            


            {/* Show success message and import button */}
            {postmanImportedItems.length > 0 && (
              <div className="space-y-4 mt-4">
                <div className="p-3 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                  <div className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Successfully imported {postmanImportedItems.length} requests! Click below to select and import.</span>
                  </div>
                </div>
                
                <Button
                  onClick={onOpenPostmanModal}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Select and Import Requests
                </Button>
              </div>
            )}

            {postmanImportedItems.length === 0 && (
              <Button
                onClick={onPostmanImport}
                disabled={isPostmanImporting || !postmanFile}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                {isPostmanImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Import Collection
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* GraphQL Card */}
      <Card className="group border-2 border-pink-400 shadow-xl hover:shadow-2xl bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 transition-all duration-500 sm:hover:scale-105 hover:border-pink-500 relative overflow-hidden sm:transform sm:hover:-translate-y-2">
        <CardHeader className="text-center pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
              <g fill="#E434AA">
                <path d="M18.39 96.852l-4.6-2.657L65.04 5.434l4.597 2.656zm0 0"/>
                <path d="M12.734 87.105H115.23v5.31H12.734zm0 0"/>
                <path d="M66.031 119.688L14.766 90.09l2.656-4.602 51.266 29.602zm0 0M110.566 42.543L59.301 12.941l2.656-4.597 51.266 29.597zm0 0"/>
                <path d="M17.434 42.523l-2.657-4.601 51.27-29.598 2.656 4.598zm0 0"/>
                <path d="M109.621 96.852L58.375 8.09l4.598-2.656 51.25 88.761zm0 0M16.8 34.398h5.313v59.204h-5.312zm0 0"/>
                <path d="M105.887 34.398h5.312v59.204h-5.312zm0 0"/>
                <path d="M65.129 117.441l-2.32-4.02 44.586-25.745 2.32 4.02zm0 0"/>
                <path d="M118.238 95.328c-3.07 5.344-9.918 7.168-15.261 4.098-5.344-3.074-7.168-9.922-4.098-15.266 3.074-5.344 9.922-7.168 15.266-4.097 5.375 3.105 7.199 9.921 4.093 15.265M29.09 43.84c-3.074 5.344-9.922 7.168-15.266 4.097-5.344-3.074-7.168-9.921-4.097-15.265 3.074-5.344 9.921-7.168 15.265-4.098 5.344 3.106 7.168 9.922 4.098 15.266M9.762 95.328c-3.075-5.344-1.25-12.16 4.093-15.266 5.344-3.07 12.16-1.246 15.266 4.098 3.07 5.344 1.246 12.16-4.098 15.266-5.375 3.07-12.191 1.246-15.261-4.098M98.91 43.84c-3.07-5.344-1.246-12.16 4.098-15.266 5.344-3.07 12.16-1.246 15.265 4.098 3.07 5.344 1.247 12.16-4.097 15.266-5.344 3.07-12.192 1.246-15.266-4.098M64 126.656a11.158 11.158 0 01-11.168-11.168A11.158 11.158 0 0164 104.32a11.158 11.158 0 0111.168 11.168c0 6.145-4.992 11.168-11.168 11.168M64 23.68a11.158 11.158 0 01-11.168-11.168A11.158 11.158 0 0164 1.344a11.158 11.158 0 0111.168 11.168A11.158 11.158 0 0164 23.68"/>
              </g>
            </svg>
          </div>
          <CardTitle className="text-lg sm:text-xl text-pink-700 dark:text-pink-300 group-hover:text-pink-800 dark:group-hover:text-pink-200 transition-colors duration-300 font-bold">
            📈 GraphQL
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0 px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-pink-500" />
              Schema introspection
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-pink-500" />
              Query generation
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-pink-500" />
              Type definitions
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="graphql-url" className="text-sm font-medium">
                GraphQL Endpoint URL
              </Label>
              <Input
                id="graphql-url"
                value={graphqlUrl}
                onChange={(e) => setGraphqlUrl(e.target.value)}
                placeholder="https://spacex-production.up.railway.app"
                className="mt-1"
              />
            </div>
            
            {graphqlImportError && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">{graphqlImportError}</span>
                </div>
              </div>
            )}
            


            {/* Show success message and import button */}
            {graphqlImportedItems.length > 0 && (
              <div className="space-y-4 mt-4">
                <div className="p-3 bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800 rounded-lg">
                  <div className="flex items-center gap-2 text-pink-700 dark:text-pink-400">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Successfully imported {graphqlImportedItems.length} operations! Click below to select and import.</span>
                  </div>
                </div>
                
                <Button
                  onClick={onOpenGraphqlModal}
                  className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Select and Import Operations
                </Button>
              </div>
            )}

            {graphqlImportedItems.length === 0 && (
              <Button
                onClick={onGraphqlImport}
                disabled={isGraphqlImporting || !graphqlUrl}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white"
              >
                {isGraphqlImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Introspecting...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Import Schema
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
