import apache_beam as beam
from apache_beam.options.pipeline_options import PipelineOptions, StandardOptions
import json

# Apache Beam Dataflow pipeline — streaming, DataflowRunner
# This pipeline processes incoming claims from Pub/Sub, extracts features, and writes to Firestore

class ProcessClaimFn(beam.DoFn):
    def process(self, element):
        # element is a Pub/Sub message payload
        try:
            msg = json.loads(element.decode('utf-8'))
            claim_text = msg.get('claim', '')
            post_id = msg.get('post_id', '')
            
            # 1. Noise stripping
            # 2. Language detection
            # 3. Embedding generation
            # 4. Vector search
            # 5. Verdict generation
            
            # Mocking the processed result
            result = {
                "post_id": post_id,
                "verdict": "UNVERIFIABLE",
                "timestamp": msg.get('timestamp', '')
            }
            
            yield result
        except Exception as e:
            yield beam.pvalue.TaggedOutput('errors', f"Error processing {element}: {e}")

def run(project_id, input_subscription, output_topic):
    options = PipelineOptions(
        project=project_id,
        runner='DataflowRunner', # Or DirectRunner for local testing
        streaming=True,
        job_name='verivani-claim-processor',
        temp_location=f'gs://virvani-verivani-bucket/temp',
        region='asia-south1'
    )
    
    with beam.Pipeline(options=options) as p:
        # Read from Pub/Sub
        messages = (p 
            | 'ReadFromPubSub' >> beam.io.ReadFromPubSub(subscription=input_subscription)
        )
        
        # Process claims
        processed_claims = (messages
            | 'ProcessClaims' >> beam.ParDo(ProcessClaimFn())
        )
        
        # Write to Pub/Sub (processed-claims topic)
        (processed_claims
            | 'FormatForPubSub' >> beam.Map(lambda x: json.dumps(x).encode('utf-8'))
            | 'WriteToPubSub' >> beam.io.WriteToPubSub(topic=output_topic)
        )
        
        # In a real app, we would also write to Firestore here using a custom DoFn or beam.io.gcp.firestore

if __name__ == '__main__':
    # run('verivani-project', 'projects/verivani-project/subscriptions/news-feed-sub', 'projects/verivani-project/topics/processed-claims')
    pass
