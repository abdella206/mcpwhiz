"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ImportCards } from "@/components/import-cards"
import { SwaggerImportModal } from "@/components/swagger-import-modal"
import { PostmanImportModal } from "@/components/postman-import-modal"
import { GraphQLImportModal } from "@/components/graphql-import-modal"
import { DemoSection } from "@/components/demo-section"
import { useApiImports } from "@/hooks/use-api-imports"
import { useServerConfigStore } from "@/store/server-config-store"
import type { ToolData } from "@/components/dynamic-code/types"

export function HomePageClient() {
  const router = useRouter()
  const [swaggerModalOpen, setSwaggerModalOpen] = useState(false)
  const [postmanModalOpen, setPostmanModalOpen] = useState(false)
  const [graphqlModalOpen, setGraphqlModalOpen] = useState(false)

  const apiImports = useApiImports()
  const { addTools } = useServerConfigStore()

  // Handle Swagger import completion
  const handleSwaggerImportCompleted = (updatedItems?: ToolData[]) => {
    const itemsToFilter = updatedItems || apiImports.swaggerImportedItems
    const toolsToAdd = itemsToFilter.filter((_, index) =>
      apiImports.swaggerSelectedItems.has(index)
    )
    addTools(toolsToAdd)
    setSwaggerModalOpen(false)
    router.push('/wizard')
  }

  // Handle Postman import completion
  const handlePostmanImportCompleted = (updatedItems?: ToolData[]) => {
    const itemsToFilter = updatedItems || apiImports.postmanImportedItems
    const toolsToAdd = itemsToFilter.filter((_, index) =>
      apiImports.postmanSelectedItems.has(index)
    )
    addTools(toolsToAdd)
    setPostmanModalOpen(false)
    router.push('/wizard')
  }

  // Handle GraphQL import completion
  const handleGraphqlImportCompleted = (updatedItems?: ToolData[]) => {
    const itemsToFilter = updatedItems || apiImports.graphqlImportedItems
    const toolsToAdd = itemsToFilter.filter((_, index) =>
      apiImports.graphqlSelectedItems.has(index)
    )
    addTools(toolsToAdd)
    setGraphqlModalOpen(false)
    router.push('/wizard')
  }

  // Handle import button clicks
  const handleSwaggerImport = async () => {
    const result = await apiImports.handleSwaggerImport()
    if (result.success && result.tools.length > 0) {
      setSwaggerModalOpen(true)
    }
  }

  const handlePostmanImport = async () => {
    const result = await apiImports.handlePostmanImport()
    if (result.success && result.tools.length > 0) {
      setPostmanModalOpen(true)
    }
  }

  const handleGraphqlImport = async () => {
    const result = await apiImports.handleGraphqlImport()
    if (result.success && result.tools.length > 0) {
      setGraphqlModalOpen(true)
    }
  }

  return (
    <>
      {/* Modals */}
      <SwaggerImportModal
        isOpen={swaggerModalOpen}
        onClose={() => {
          setSwaggerModalOpen(false)
          apiImports.resetSwaggerImport()
        }}
        swaggerImportedItems={apiImports.swaggerImportedItems}
        swaggerSelectedItems={apiImports.swaggerSelectedItems}
        onSelectionChange={apiImports.setSwaggerSelectedItems}
        onImport={handleSwaggerImportCompleted}
      />

      <PostmanImportModal
        isOpen={postmanModalOpen}
        onClose={() => setPostmanModalOpen(false)}
        postmanImportedItems={apiImports.postmanImportedItems}
        postmanSelectedItems={apiImports.postmanSelectedItems}
        onSelectionChange={apiImports.setPostmanSelectedItems}
        onImport={handlePostmanImportCompleted}
      />

      <GraphQLImportModal
        isOpen={graphqlModalOpen}
        onClose={() => setGraphqlModalOpen(false)}
        graphqlImportedItems={apiImports.graphqlImportedItems}
        graphqlSelectedItems={apiImports.graphqlSelectedItems}
        onSelectionChange={apiImports.setGraphqlSelectedItems}
        onImport={handleGraphqlImportCompleted}
      />

      {/* Interactive Import Cards */}
      <ImportCards
        swaggerUrl={apiImports.swaggerUrl}
        setSwaggerUrl={apiImports.setSwaggerUrl}
        swaggerFile={apiImports.swaggerFile}
        setSwaggerFile={apiImports.setSwaggerFile}
        isSwaggerImporting={apiImports.isSwaggerImporting}
        swaggerImportSuccess={apiImports.swaggerImportSuccess}
        swaggerImportError={apiImports.swaggerImportError}
        swaggerImportedItems={apiImports.swaggerImportedItems}
        swaggerSelectedItems={apiImports.swaggerSelectedItems}
        setSwaggerSelectedItems={apiImports.setSwaggerSelectedItems}
        onSwaggerImport={handleSwaggerImport}
        onSwaggerImportSelected={handleSwaggerImportCompleted}
        onOpenSwaggerModal={() => setSwaggerModalOpen(true)}
        
        postmanFile={apiImports.postmanFile}
        setPostmanFile={apiImports.setPostmanFile}
        isPostmanImporting={apiImports.isPostmanImporting}
        postmanImportSuccess={apiImports.postmanImportSuccess}
        postmanImportError={apiImports.postmanImportError}
        postmanImportedItems={apiImports.postmanImportedItems}
        postmanSelectedItems={apiImports.postmanSelectedItems}
        setPostmanSelectedItems={apiImports.setPostmanSelectedItems}
        onPostmanImport={handlePostmanImport}
        onPostmanImportSelected={handlePostmanImportCompleted}
        onOpenPostmanModal={() => setPostmanModalOpen(true)}
        
        graphqlUrl={apiImports.graphqlUrl}
        setGraphqlUrl={apiImports.setGraphqlUrl}
        isGraphqlImporting={apiImports.isGraphqlImporting}
        graphqlImportSuccess={apiImports.graphqlImportSuccess}
        graphqlImportError={apiImports.graphqlImportError}
        graphqlImportedItems={apiImports.graphqlImportedItems}
        graphqlSelectedItems={apiImports.graphqlSelectedItems}
        setGraphqlSelectedItems={apiImports.setGraphqlSelectedItems}
        onGraphqlImport={handleGraphqlImport}
        onGraphqlImportSelected={handleGraphqlImportCompleted}
        onOpenGraphqlModal={() => setGraphqlModalOpen(true)}
        
        isDraggingSwagger={apiImports.isDraggingSwagger}
        setIsDraggingSwagger={apiImports.setIsDraggingSwagger}
        isDraggingPostman={apiImports.isDraggingPostman}
        setIsDraggingPostman={apiImports.setIsDraggingPostman}
        onSwaggerDragOver={apiImports.handleSwaggerDragOver}
        onSwaggerDragLeave={apiImports.handleSwaggerDragLeave}
        onSwaggerDrop={apiImports.handleSwaggerDrop}
        onPostmanDragOver={apiImports.handlePostmanDragOver}
        onPostmanDragLeave={apiImports.handlePostmanDragLeave}
        onPostmanDrop={apiImports.handlePostmanDrop}
      />

      {/* Demo Section */}
      <DemoSection />
    </>
  )
}
