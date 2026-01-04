.PHONY: help install dev build start test lint format clean docker-build docker-run deploy setup-gcloud create-artifact-registry migrate-db

# Variables
PROJECT_ID := mmaruyama
SERVICE_NAME := daily-report
REGION := asia-northeast1
DOCKER_IMAGE := $(REGION)-docker.pkg.dev/$(PROJECT_ID)/$(SERVICE_NAME)/$(SERVICE_NAME)

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

install: ## Install dependencies
	npm install

dev: ## Start development server
	npm run dev

build: ## Build the application
	npm run build

start: ## Start production server
	npm run start

test: ## Run tests
	npm run test

test-watch: ## Run tests in watch mode
	npm run test:watch

test-coverage: ## Run tests with coverage
	npm run test:coverage

lint: ## Run linter
	npm run lint

lint-fix: ## Fix linting errors
	npm run lint:fix

format: ## Format code with Prettier
	npm run format

format-check: ## Check code formatting
	npm run format:check

type-check: ## Run TypeScript type checking
	npm run type-check

prisma-generate: ## Generate Prisma Client
	npx prisma generate

prisma-migrate: ## Run Prisma migrations
	npx prisma migrate dev

prisma-migrate-deploy: ## Deploy Prisma migrations (production)
	npx prisma migrate deploy

prisma-studio: ## Open Prisma Studio
	npx prisma studio

prisma-seed: ## Seed database
	npx prisma db seed

clean: ## Clean build artifacts
	rm -rf .next node_modules coverage .husky/_

# Docker commands
docker-build: ## Build Docker image locally
	docker build -t $(SERVICE_NAME):latest .

docker-run: ## Run Docker container locally
	docker run -p 3000:3000 --env-file .env.local $(SERVICE_NAME):latest

# Google Cloud commands
setup-gcloud: ## Setup Google Cloud CLI
	@echo "Configuring gcloud for project $(PROJECT_ID)..."
	gcloud config set project $(PROJECT_ID)
	gcloud config set run/region $(REGION)
	@echo "Setup complete!"

auth-docker: ## Authenticate Docker with Artifact Registry
	gcloud auth configure-docker $(REGION)-docker.pkg.dev

create-artifact-registry: ## Create Artifact Registry repository
	gcloud artifacts repositories create $(SERVICE_NAME) \
		--repository-format=docker \
		--location=$(REGION) \
		--description="Docker repository for $(SERVICE_NAME)"

build-push: ## Build and push Docker image to Artifact Registry
	docker build -t $(DOCKER_IMAGE):latest .
	docker push $(DOCKER_IMAGE):latest

deploy: build-push ## Deploy to Cloud Run
	gcloud run deploy $(SERVICE_NAME) \
		--image $(DOCKER_IMAGE):latest \
		--platform managed \
		--region $(REGION) \
		--allow-unauthenticated \
		--memory 512Mi \
		--cpu 1 \
		--max-instances 10 \
		--min-instances 0 \
		--timeout 300 \
		--set-env-vars="DATABASE_URL=$${DATABASE_URL},NEXTAUTH_URL=$${NEXTAUTH_URL},NEXTAUTH_SECRET=$${NEXTAUTH_SECRET}"

migrate-db: ## Run database migrations on Cloud Run
	@echo "Running database migrations..."
	gcloud run jobs create migrate-db \
		--image $(DOCKER_IMAGE):latest \
		--region $(REGION) \
		--set-env-vars="DATABASE_URL=$${DATABASE_URL}" \
		--tasks 1 \
		--max-retries 3 \
		--task-timeout 10m \
		--command="npx,prisma,migrate,deploy" || true
	gcloud run jobs execute migrate-db --region $(REGION) --wait

deploy-full: deploy migrate-db ## Full deployment (build, push, deploy, migrate)
	@echo "Deployment complete!"
	@gcloud run services describe $(SERVICE_NAME) --region $(REGION) --format 'value(status.url)'

logs: ## View Cloud Run logs
	gcloud run services logs tail $(SERVICE_NAME) --region $(REGION)

# Development workflow
prepare: install prisma-generate ## Prepare development environment
	npm run prepare

check: lint type-check test ## Run all checks (lint, type-check, test)

ci: check build ## Run CI pipeline locally
