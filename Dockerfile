# Use the Node.js 22 slim image as the base image.
FROM node:22-slim

# Set the PNPM_HOME environment variable to the specified directory.
# This defines where PNPM will store its global installations.
ENV PNPM_HOME="/root/.local/share/pnpm"

# Add PNPM_HOME to the PATH environment variable.
# This makes the 'pnpm' command available globally in the container.
ENV PATH="${PATH}:${PNPM_HOME}"

# Install PNPM globally using npm.
# PNPM will be used as the package manager for this project.
RUN npm install --global pnpm

# Update the package lists and install necessary system packages.
# These packages are dependencies for building and running the application, including development tools.
# --no-install-recommends to avoid installing unneeded packages.
RUN apt update -y && apt install -y --no-install-recommends \
    libwebkit2gtk-4.1-dev \
    build-essential \ # Package to provide make, gcc and other compiling tools.
    curl \ # command-line utility for transferring data with URLs.
    wget \ # utility for retrieving files using HTTP, HTTPS, FTP and FTPS.
    file \ # command for identify file type.
    libxdo-dev \ # library for emulating keyboard and mouse events.
    libssl-dev \ # development package for OpenSSL libraries.
    libayatana-appindicator3-dev \ # libary to get the appindicator to work.
    librsvg2-dev \ # library to support the display of svg files.
    ca-certificates \ # package to store the system's certificates.
    && apt-get clean && rm -rf /var/lib/apt/lists/* # remove unneeded files from the apt cache.

# Install Rust and Cargo using rustup.
# Rust is needed to build the tauri application.
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y

# Add Rust's Cargo bin directory to the PATH.
ENV PATH="/root/.cargo/bin:${PATH}"

# Copy the current directory's contents to the /app directory in the container.
COPY . /app

# Set the working directory to /app.
WORKDIR /app

# Install project dependencies using PNPM.
RUN pnpm install

# Setup PDF.js for the web application.
RUN pnpm --filter @readest/readest-app setup-pdfjs

# Navigate to the web application directory.
WORKDIR /app/apps/readest-app

# Build the web application.
RUN pnpm build-web

# Define the command to run when the container starts.
# Start the web application using pnpm.
ENTRYPOINT ["pnpm", "start-web"]
