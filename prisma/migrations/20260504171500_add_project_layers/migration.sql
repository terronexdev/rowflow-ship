-- Add project-level GeoJSON reference layers for county GIS overlays.
CREATE TABLE "project_layers" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "datasetId" TEXT,
    "sourceUrl" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'reference',
    "geometryType" TEXT,
    "featureCount" INTEGER NOT NULL DEFAULT 0,
    "data" JSONB NOT NULL,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "opacity" DOUBLE PRECISION NOT NULL DEFAULT 0.55,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_layers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "project_layers_projectId_idx" ON "project_layers"("projectId");
CREATE INDEX "project_layers_datasetId_idx" ON "project_layers"("datasetId");

ALTER TABLE "project_layers"
ADD CONSTRAINT "project_layers_projectId_fkey"
FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
