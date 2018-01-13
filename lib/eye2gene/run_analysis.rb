require 'English'
require 'forwardable'
require 'json'

# Eye2Gene NameSpace
module Eye2Gene
  # Module to run the OCT Segmentation analysis
  module Eye2GeneAnalysis
    # To signal error in parameters provided.
    #
    # ArgumentError is raised when When the file the
    class ArgumentError < ArgumentError
    end

    # To signal internal errors.
    #
    # RuntimeError is raised when there is a problem in running matlab Script,
    # writing the output etc. These are rare, infrastructure errors, used
    # internally, and of concern only to the admins/developers.
    # One example of a RuntimeError would be matlab not installed.
    class RuntimeError < RuntimeError
    end

    class << self
      extend Forwardable

      def_delegators Eye2Gene, :config, :logger, :users_dir, :tmp_dir,

      # Runs the matlab analysis
      def run(params, user, url)
        init(params, user)
        run_analysis
        write_results_to_file(url)
        { exit_code: @exit_code,
          assets_path: "#{url}/eye2gene/users/#{@email}/#{@uniq_time}",
          results_url: "#{url}/result/#{encode_email}/#{@uniq_time}",
          share_url: "#{url}/sh/#{encode_email}/#{@uniq_time}",
          uuid: @uniq_time }
      end

      private

      # sets up analysis
      def init(params, user)
        @params = params
        @email = user
        @params[:files] = JSON.parse(@params[:files], symbolize_names: true)
        assert_params
        @uniq_time = Time.new.strftime('%Y-%m-%d_%H-%M-%S_%L-%N').to_s
        setup_run_dir
      end

      def assert_params
        return if assert_param_exist && assert_files && assert_files_exists
        raise ArgumentError, 'Failed to upload files'
      end

      def assert_param_exist
        !@params.nil?
      end

      def assert_files
        @params[:files].collect { |f| f[:status] == 'upload successful' }.uniq
      end

      def assert_files_exists
        files = @params[:files].collect do |f|
          File.exist?(File.join(tmp_dir, f[:uuid], f[:originalName]))
        end
        files.uniq
      end

      def setup_run_dir
        @run_dir = File.join(users_dir, @email, @uniq_time)
        @run_out_dir = File.join(@run_dir, 'out')
        @run_files_dir = File.join(@run_dir, 'files')
        logger.debug("Creating Run Directory: #{@run_dir}")
        FileUtils.mkdir_p(@run_files_dir)
        FileUtils.mkdir_p(@run_out_dir)
        move_uploaded_files_into_run_dir
      end

      def move_uploaded_files_into_run_dir
        @params[:files].each do |f|
          t_dir = File.join(tmp_dir, f[:uuid])
          t_input_file = File.join(t_dir, f[:originalName])
          f = File.join(@run_files_dir, f[:originalName])
          FileUtils.mv(t_input_file, f)
          next unless (Dir.entries(t_dir) - %w[. ..]).empty?
          FileUtils.rm_r(t_dir)
        end
      end

      def run_analysis
        logger.debug("Running CMD: #{analysis_cmd}")
        system(analysis_cmd)
        @exit_code = $CHILD_STATUS.exitstatus
        logger.debug("Matlab CMD Exit Code: #{@exit_code}")
      end

      def analysis_cmd
        "#{config[:analysis_script]} '#{file_names}' '#{@run_out_dir}/out.json'"
      end

      def file_names
        fnames = @params[:files].collect { |f| f[:originalName] }
        return File.join(@run_files_dir, fnames[0]) if fnames.length == 1
        @run_files_dir
      end

      def write_results_to_file(url)
        results = generate_results_hash(url)
        params_file = File.join(@run_dir, 'params.json')
        File.open(params_file, 'w') { |io| io.puts results.to_json }
      end

      def generate_results_hash(url)
        {
          params: @params,
          user: encode_email,
          results_url: "#{url}/result/#{encode_email}/#{@uniq_time}",
          share_url: "#{url}/sh/#{encode_email}/#{@uniq_time}",
          assets_path: "#{url}/eye2gene/users/#{@email}/#{@uniq_time}",
          full_path: @run_dir,
          uniq_result_id: @uniq_time,
          exit_code: @exit_code
        }
      end

      def encode_email
        Base64.encode64(@email).chomp
      end
    end
  end
end
