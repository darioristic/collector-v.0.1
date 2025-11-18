export type TemplateTask = {
	title: string;
	description: string | null;
	status?: "todo" | "in_progress" | "blocked" | "done";
};

export type TemplatePhase = {
	title: string;
	description: string | null;
	tasks: TemplateTask[];
};

export type ProjectTemplate = {
	id: string;
	title: string;
	description: string;
	durationEstimate: string;
	keyTools: string[];
	phases: TemplatePhase[];
};

export const projectTemplates: ProjectTemplate[] = [
	{
		id: "openshift-implementation",
		title: "OpenShift Implementation",
		description:
			"Complete OpenShift cluster deployment and application migration strategy with CI/CD pipeline integration.",
		durationEstimate: "8-12 weeks",
		keyTools: ["OpenShift", "Kubernetes", "Helm", "GitLab CI/CD", "Prometheus"],
		phases: [
			{
				title: "Planning & Assessment",
				description: "Infrastructure assessment and migration planning",
				tasks: [
					{
						title: "Assess current infrastructure and applications",
						description:
							"Review existing infrastructure, identify workloads for migration",
					},
					{
						title: "Design OpenShift cluster architecture",
						description:
							"Plan cluster topology, networking, and resource allocation",
					},
					{
						title: "Create migration strategy document",
						description:
							"Document migration approach, timelines, and rollback procedures",
					},
					{
						title: "Identify security and compliance requirements",
						description:
							"Map security policies and compliance needs to OpenShift",
					},
				],
			},
			{
				title: "Cluster Setup",
				description: "OpenShift cluster installation and configuration",
				tasks: [
					{
						title: "Install OpenShift cluster",
						description: "Deploy control plane and worker nodes",
					},
					{
						title: "Configure networking and storage",
						description:
							"Set up SDN, ingress controllers, and persistent storage",
					},
					{
						title: "Set up authentication and authorization",
						description: "Configure OAuth, RBAC, and user management",
					},
					{
						title: "Install cluster monitoring and logging",
						description: "Deploy Prometheus, Grafana, and logging stack",
					},
				],
			},
			{
				title: "Application Migration",
				description: "Migrate applications to OpenShift",
				tasks: [
					{
						title: "Containerize applications",
						description: "Create Dockerfiles and optimize container images",
					},
					{
						title: "Create deployment configurations",
						description: "Set up DeploymentConfigs, Services, and Routes",
					},
					{
						title: "Migrate databases and stateful services",
						description: "Plan and execute database migration strategy",
					},
					{
						title: "Test application functionality",
						description: "Perform end-to-end testing of migrated applications",
					},
				],
			},
			{
				title: "CI/CD Integration",
				description: "Set up continuous integration and deployment pipelines",
				tasks: [
					{
						title: "Configure GitLab CI/CD pipelines",
						description: "Set up build, test, and deployment pipelines",
					},
					{
						title: "Implement automated testing",
						description: "Add unit, integration, and e2e tests to pipelines",
					},
					{
						title: "Set up deployment strategies",
						description: "Configure blue-green and canary deployment patterns",
					},
					{
						title: "Document CI/CD processes",
						description: "Create runbooks and documentation for team",
					},
				],
			},
		],
	},
	{
		id: "devops-automation-setup",
		title: "DevOps Automation Setup",
		description:
			"Establish comprehensive DevOps automation pipeline with infrastructure as code, automated testing, and deployment workflows.",
		durationEstimate: "6-10 weeks",
		keyTools: ["Terraform", "Ansible", "Jenkins", "Docker", "AWS"],
		phases: [
			{
				title: "Infrastructure as Code",
				description: "Set up IaC foundation with Terraform",
				tasks: [
					{
						title: "Design infrastructure architecture",
						description:
							"Plan cloud infrastructure layout and resource organization",
					},
					{
						title: "Create Terraform modules",
						description:
							"Develop reusable Terraform modules for common resources",
					},
					{
						title: "Set up state management",
						description: "Configure remote state backend and state locking",
					},
					{
						title: "Implement infrastructure testing",
						description: "Add Terratest or similar testing framework",
					},
				],
			},
			{
				title: "Configuration Management",
				description: "Automate server configuration with Ansible",
				tasks: [
					{
						title: "Create Ansible playbooks",
						description:
							"Develop playbooks for server provisioning and configuration",
					},
					{
						title: "Set up Ansible inventory",
						description: "Organize hosts and groups in dynamic inventory",
					},
					{
						title: "Implement secrets management",
						description:
							"Integrate Vault or similar for secure credential handling",
					},
					{
						title: "Automate application deployment",
						description: "Create deployment automation scripts",
					},
				],
			},
			{
				title: "CI/CD Pipeline",
				description: "Build continuous integration and deployment pipeline",
				tasks: [
					{
						title: "Set up Jenkins server",
						description: "Install and configure Jenkins with required plugins",
					},
					{
						title: "Create pipeline jobs",
						description:
							"Develop Jenkinsfile pipelines for build and deployment",
					},
					{
						title: "Integrate automated testing",
						description: "Add test stages to CI/CD pipeline",
					},
					{
						title: "Implement deployment automation",
						description: "Automate deployment to staging and production",
					},
				],
			},
			{
				title: "Monitoring & Observability",
				description: "Set up monitoring and alerting systems",
				tasks: [
					{
						title: "Deploy monitoring stack",
						description: "Set up Prometheus, Grafana, and AlertManager",
					},
					{
						title: "Configure application metrics",
						description: "Instrument applications with metrics collection",
					},
					{
						title: "Set up log aggregation",
						description: "Implement centralized logging with ELK or Loki",
					},
					{
						title: "Create alerting rules",
						description: "Define alert conditions and notification channels",
					},
				],
			},
		],
	},
	{
		id: "observability-stack-implementation",
		title: "Observability Stack Implementation",
		description:
			"Deploy comprehensive observability solution with metrics, logs, traces, and APM for full-stack visibility.",
		durationEstimate: "4-8 weeks",
		keyTools: ["Prometheus", "Grafana", "Jaeger", "ELK", "OpenTelemetry"],
		phases: [
			{
				title: "Metrics Collection",
				description: "Set up metrics collection and storage",
				tasks: [
					{
						title: "Deploy Prometheus cluster",
						description:
							"Install and configure Prometheus for metrics scraping",
					},
					{
						title: "Configure service discovery",
						description: "Set up automatic target discovery for services",
					},
					{
						title: "Create recording and alerting rules",
						description: "Define metrics aggregation and alert conditions",
					},
					{
						title: "Set up long-term storage",
						description: "Configure Thanos or similar for metrics retention",
					},
				],
			},
			{
				title: "Visualization & Dashboards",
				description: "Build Grafana dashboards and visualization",
				tasks: [
					{
						title: "Deploy Grafana instance",
						description: "Install Grafana and connect to Prometheus",
					},
					{
						title: "Create application dashboards",
						description: "Build custom dashboards for key applications",
					},
					{
						title: "Set up dashboard templating",
						description: "Create reusable dashboard templates with variables",
					},
					{
						title: "Configure alerting in Grafana",
						description: "Set up alert rules and notification channels",
					},
				],
			},
			{
				title: "Distributed Tracing",
				description: "Implement distributed tracing with Jaeger",
				tasks: [
					{
						title: "Deploy Jaeger backend",
						description:
							"Install Jaeger collector, query, and storage components",
					},
					{
						title: "Instrument applications with OpenTelemetry",
						description: "Add tracing SDK to applications",
					},
					{
						title: "Configure trace sampling",
						description: "Set up sampling strategies for trace collection",
					},
					{
						title: "Create trace analysis dashboards",
						description:
							"Build dashboards for trace visualization and analysis",
					},
				],
			},
			{
				title: "Log Aggregation",
				description: "Set up centralized logging solution",
				tasks: [
					{
						title: "Deploy ELK or Loki stack",
						description: "Install Elasticsearch, Logstash, Kibana or Loki",
					},
					{
						title: "Configure log collection agents",
						description: "Set up Filebeat, Fluentd, or similar agents",
					},
					{
						title: "Create log parsing and indexing rules",
						description: "Define parsers and index patterns for log analysis",
					},
					{
						title: "Build log analysis dashboards",
						description: "Create Kibana dashboards for log visualization",
					},
				],
			},
		],
	},
	{
		id: "iac-deployment",
		title: "IaC Deployment",
		description:
			"Implement Infrastructure as Code practices with Terraform, automated provisioning, and environment management.",
		durationEstimate: "5-9 weeks",
		keyTools: [
			"Terraform",
			"CloudFormation",
			"Git",
			"GitHub Actions",
			"AWS/Azure",
		],
		phases: [
			{
				title: "Foundation Setup",
				description: "Establish IaC repository and tooling",
				tasks: [
					{
						title: "Set up version control repository",
						description: "Create Git repository structure for IaC code",
					},
					{
						title: "Install and configure Terraform",
						description: "Set up Terraform CLI and workspace management",
					},
					{
						title: "Configure cloud provider credentials",
						description: "Set up authentication and access policies",
					},
					{
						title: "Create project structure",
						description: "Organize modules, environments, and configurations",
					},
				],
			},
			{
				title: "Module Development",
				description: "Develop reusable Terraform modules",
				tasks: [
					{
						title: "Create network module",
						description: "Develop VPC, subnets, and networking components",
					},
					{
						title: "Create compute module",
						description:
							"Build modules for EC2, ECS, or similar compute resources",
					},
					{
						title: "Create storage module",
						description: "Develop modules for S3, EBS, and database storage",
					},
					{
						title: "Create security module",
						description: "Build IAM, security groups, and compliance modules",
					},
				],
			},
			{
				title: "Environment Configuration",
				description: "Set up multi-environment infrastructure",
				tasks: [
					{
						title: "Create development environment",
						description: "Provision development infrastructure",
					},
					{
						title: "Create staging environment",
						description:
							"Set up staging environment with production-like config",
					},
					{
						title: "Create production environment",
						description:
							"Provision production infrastructure with high availability",
					},
					{
						title: "Implement environment-specific configurations",
						description: "Manage environment variables and secrets",
					},
				],
			},
			{
				title: "Automation & CI/CD",
				description: "Automate infrastructure deployment",
				tasks: [
					{
						title: "Set up GitHub Actions workflows",
						description: "Create CI/CD pipelines for infrastructure changes",
					},
					{
						title: "Implement plan and apply automation",
						description: "Automate Terraform plan and apply in pipelines",
					},
					{
						title: "Add infrastructure testing",
						description: "Integrate Terratest or similar testing framework",
					},
					{
						title: "Create deployment documentation",
						description: "Document deployment processes and runbooks",
					},
				],
			},
		],
	},
];
