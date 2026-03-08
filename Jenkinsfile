pipeline {
    agent any

    environment {
        DB_PASSWORD = credentials('mdnote-db-password')
        JWT_SECRET = credentials('mdnote-jwt-secret')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Backend Build') {
            steps {
                dir('backend') {
                    sh 'chmod +x gradlew'
                    sh './gradlew clean build -x test'
                }
            }
        }

        stage('Frontend Build') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Docker Build & Deploy') {
            steps {
                sh 'docker compose down'
                sh 'docker compose up -d --build'
            }
        }
    }

    post {
        failure {
            echo 'mdnote 배포 실패'
        }
        success {
            echo 'mdnote 배포 성공'
        }
    }
}
