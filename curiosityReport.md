#### Docker: How Containers Actually Run My Backend

### Introduction
    Docker is a containerization platform that allows developers to package applications and their dependencies into lightweight, portable units called containers. These containers can run consistently across different environments, from local machines to cloud platforms like AWS.

### Problem Solved
- Some common problems without containers include:
- Applications working on one machine but not another
- Dependency and environment inconsistencies
- Difficulty reproducing bugs
- Slower and more complex deployments

    Before learning about Docker, deploying applications felt somewhat unclear to me. When working on the JWT Pizza project, I knew that my backend was being deployed to AWS, but I didn’t fully understand how it was actually running. Docker solves these issues by packaging everything the application needs into a single container that can run anywhere.

### Core Concepts
## Docker Image
    A Docker image is a read-only snapshot of an application that includes the code, runtime, libraries, and dependencies needed to run it.

## Docker Container
    A container is a running instance of a Docker image. This is where the application actually executes.

## Docker Registry
    A registry is where Docker images are stored, such as in AWS like on our project

### How Docker Actually Runs My Backend
    When a Container Starts, Docker does the following
    - Pulls the image from the registry
    - Creates an isolated environment for the container
    - Start the application process inside the container

    Docker uses features built into the Linux operating system:
    - Namespaces isolate the container from rest of the system
        - Separate procces list
        - Separate filesystem
        - Separate network
    - Contorl groups limit resource usage
        - CPU limits
        - Memory limits
    
    Because of this, each container behaves like its own independent environment, even though it is running on the same machine as other containers. This means that my backend is not running on its own virtual machine, it is simply a process running inside a controlled and isolated environment.

### Comparison to Virtual Machines
    Before containers virtual machiens were commonly used for isolation.
    - Virtual machines run an entire operating system
    - They are slower to start and use more resoucres

    Verses Containers which:
    - Share the host operating system
    - Start in seconds
    - Use fewer resources

    This is why cloud providers like AWS use containers for scalable applications.

### Why Dockers Matter
    Dockers provide several important benefits:
    - Consistency: The same application runs the same way everywhere
    - Scalability: Multiple containers can be created to handle increased traffic
    - Speed: Containers start quickly compared to virtual machines
    - Isolation: Applications do not interfere with each other
    Understanding Docker made the deployment process much clearer to me and helped connect how my code actually runs in a real-world system.


### Conclusion
    Docker is a fundamental tool in modern DevOps because it simplifies application deployment and ensures consistency across environments. By using containers, developers can package their applications in a way that is portable, efficient, and scalable. Learning how Docker actually runs my backend helped me better understand how systems like JWT Pizza operate in production. Instead of viewing deployment as a complex or hidden process, I now see it as a structured system where containers isolate, execute, and scale applications efficiently.